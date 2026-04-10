import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CurriculumService {
  private readonly logger = new Logger(CurriculumService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ─── 조회 (24시간 캐시) 또는 신규 생성 ─────────────────────────
  async getOrGenerate(userId: string) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const cached = await this.prisma.curriculumRecommendation.findFirst({
      where: {
        userId,
        generatedAt: { gte: twentyFourHoursAgo },
      },
      orderBy: { generatedAt: 'desc' },
    });

    if (cached) return cached;

    return this.generate(userId);
  }

  // ─── 강제 재생성 ───────────────────────────────────────────────
  async generate(userId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 4개 데이터 소스를 병렬 조회
    const [tasks, tils, conversations, agoras] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: 'DONE',
          updatedAt: { gte: thirtyDaysAgo },
        },
        select: { title: true, taskType: true, tags: true },
        take: 20,
      }),
      this.prisma.til.findMany({
        where: {
          authorId: userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { title: true, tags: true },
        take: 20,
      }),
      this.prisma.aIConversation.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { title: true },
        take: 20,
      }),
      this.prisma.agora.findMany({
        where: {
          authorId: userId,
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { title: true },
        take: 20,
      }),
    ]);

    const summary = this.buildActivitySummary(tasks, tils, conversations, agoras);

    // 활동 데이터가 전혀 없으면 기본 추천 반환
    if (!summary) {
      const items = this.getDefaultItems();
      return this.prisma.curriculumRecommendation.create({
        data: { userId, items, generatedAt: new Date() },
      });
    }

    // AI 호출로 추천 생성
    const items = await this.callAI(summary);

    return this.prisma.curriculumRecommendation.create({
      data: { userId, items, generatedAt: new Date() },
    });
  }

  // ─── 활동 요약 텍스트 빌드 ─────────────────────────────────────
  private buildActivitySummary(
    tasks: { title: string; taskType: string | null; tags: string[] }[],
    tils: { title: string; tags: string[] }[],
    conversations: { title: string | null }[],
    agoras: { title: string }[],
  ): string {
    const sections: string[] = [];

    if (tasks.length > 0) {
      const lines = tasks.map((t) => {
        const parts = [t.title];
        if (t.taskType) parts.push(`(유형: ${t.taskType})`);
        if (t.tags?.length) parts.push(`[${t.tags.join(', ')}]`);
        return `- ${parts.join(' ')}`;
      });
      sections.push(`## 완료한 Task (${tasks.length}개)\n${lines.join('\n')}`);
    }

    if (tils.length > 0) {
      const lines = tils.map((t) => {
        const parts = [t.title];
        if (t.tags?.length) parts.push(`[${t.tags.join(', ')}]`);
        return `- ${parts.join(' ')}`;
      });
      sections.push(`## 작성한 TIL (${tils.length}개)\n${lines.join('\n')}`);
    }

    const validConversations = conversations.filter((c) => c.title);
    if (validConversations.length > 0) {
      const lines = validConversations.map((c) => `- ${c.title}`);
      sections.push(`## AI 멘토링 대화 (${validConversations.length}개)\n${lines.join('\n')}`);
    }

    if (agoras.length > 0) {
      const lines = agoras.map((a) => `- ${a.title}`);
      sections.push(`## 아고라 질문 (${agoras.length}개)\n${lines.join('\n')}`);
    }

    return sections.length > 0 ? sections.join('\n\n') : '';
  }

  // ─── OpenAI gpt-4o-mini JSON 호출 ─────────────────────────────
  private async callAI(summary: string): Promise<any[]> {
    try {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({
        apiKey: this.config.get<string>('OPENAI_API_KEY'),
      });

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 1000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              '당신은 IT 학습 커리큘럼 추천 전문가입니다. 사용자의 최근 활동을 분석하여 다음 주에 학습하면 좋을 주제 5가지를 추천해주세요. 반드시 JSON 형식으로 응답하세요: { "items": [{ "title": "주제", "reason": "추천 이유 (1~2문장)" }] } 한국어로 답변하세요.',
          },
          {
            role: 'user',
            content: `다음은 최근 30일간의 활동 기록입니다:\n\n${summary}\n\n이 활동을 바탕으로 다음 주 학습 추천 5가지를 생성해주세요.`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return this.getDefaultItems();

      const parsed = JSON.parse(content);
      if (Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed.items;
      }

      return this.getDefaultItems();
    } catch (err) {
      this.logger.error(`AI 커리큘럼 추천 실패: ${(err as Error).message}`);
      return this.getDefaultItems();
    }
  }

  // ─── 기본 추천 항목 (AI 실패 시 폴백) ─────────────────────────
  private getDefaultItems(): any[] {
    return [
      { title: '클린 코드 원칙 복습', reason: '코드 품질 향상을 위한 기본기를 다지세요' },
      { title: 'Git 브랜치 전략 학습', reason: '팀 프로젝트 효율을 높이는 협업 스킬입니다' },
      { title: 'REST API 설계 패턴', reason: '백엔드 개발의 핵심 역량입니다' },
      { title: 'React/Vue 컴포넌트 패턴', reason: '프론트엔드 생산성을 높여줍니다' },
      { title: 'SQL 쿼리 최적화', reason: '데이터베이스 성능 개선의 기본입니다' },
    ];
  }
}
