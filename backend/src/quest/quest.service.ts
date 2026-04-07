import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from '../xp/xp.service';

// 퀘스트 조건 키 상수
export const QUEST_KEYS = {
  TIL_WRITE:      'TIL_WRITE',
  POST_WRITE:     'POST_WRITE',
  COMMENT_WRITE:  'COMMENT_WRITE',
  AGORA_ANSWER:   'AGORA_ANSWER',
  AI_CHAT:        'AI_CHAT',
} as const;

// 기본 데일리 퀘스트 시드 데이터
const DEFAULT_QUESTS = [
  {
    title: 'TIL 작성하기',
    description: '오늘 배운 것을 TIL로 기록하세요',
    type: 'DAILY' as const,
    conditionKey: QUEST_KEYS.TIL_WRITE,
    xpReward: 20,
    creditReward: 5,
  },
  {
    title: '커뮤니티 글 작성하기',
    description: '커뮤니티에 게시글을 작성하세요',
    type: 'DAILY' as const,
    conditionKey: QUEST_KEYS.POST_WRITE,
    xpReward: 15,
    creditReward: 3,
  },
  {
    title: '댓글 달기',
    description: '다른 사람의 게시글에 댓글을 달아보세요',
    type: 'DAILY' as const,
    conditionKey: QUEST_KEYS.COMMENT_WRITE,
    xpReward: 10,
    creditReward: 2,
  },
  {
    title: '아고라 답변하기',
    description: '아고라에서 질문에 답변을 달아보세요',
    type: 'DAILY' as const,
    conditionKey: QUEST_KEYS.AGORA_ANSWER,
    xpReward: 20,
    creditReward: 5,
  },
  {
    title: 'AI 멘토링 이용하기',
    description: 'AI 멘토에게 질문하세요',
    type: 'DAILY' as const,
    conditionKey: QUEST_KEYS.AI_CHAT,
    xpReward: 10,
    creditReward: 2,
  },
];

@Injectable()
export class QuestService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
  ) {}

  /**
   * 앱 시작 시 기본 퀘스트 시드 (없으면 전체 생성)
   * 하나라도 있으면 건너뜀 (중복 방지)
   */
  async onModuleInit() {
    const count = await this.prisma.quest.count();
    if (count === 0) {
      await this.prisma.quest.createMany({ data: DEFAULT_QUESTS });
    }
  }

  /**
   * 오늘의 퀘스트 목록 + 사용자 진행 상황
   */
  async getDailyQuests(userId: string) {
    const today = this.today();

    const quests = await this.prisma.quest.findMany({
      where: { type: 'DAILY', isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    const progresses = await this.prisma.questProgress.findMany({
      where: {
        userId,
        questId: { in: quests.map((q) => q.id) },
        date: today,
      },
    });

    const progressMap = new Map(progresses.map((p) => [p.questId, p]));

    return quests.map((q) => {
      const progress = progressMap.get(q.id);
      return {
        ...q,
        completed: progress?.completed ?? false,
        completedAt: progress?.completedAt ?? null,
      };
    });
  }

  /**
   * 특정 활동 수행 시 퀘스트 자동 완료 처리
   * - post/comment/agora/til/ai-mentor 서비스에서 호출
   */
  async checkAndComplete(userId: string, conditionKey: string): Promise<void> {
    const today = this.today();

    const quest = await this.prisma.quest.findFirst({
      where: { conditionKey, type: 'DAILY', isActive: true },
    });
    if (!quest) return;

    // 이미 완료했으면 무시
    const existing = await this.prisma.questProgress.findUnique({
      where: { userId_questId_date: { userId, questId: quest.id, date: today } },
    });
    if (existing?.completed) return;

    // QuestProgress upsert + 완료 처리
    await this.prisma.questProgress.upsert({
      where: { userId_questId_date: { userId, questId: quest.id, date: today } },
      create: { userId, questId: quest.id, date: today, completed: true, completedAt: new Date() },
      update: { completed: true, completedAt: new Date() },
    });

    // 보상 지급
    if (quest.xpReward > 0) {
      await this.xp.grantXP(userId, quest.xpReward);
    }
    if (quest.creditReward > 0) {
      await this.prisma.$transaction([
        this.prisma.creditTransaction.create({
          data: {
            userId,
            amount: quest.creditReward,
            type: 'EARN',
            description: `퀘스트 완료: ${quest.title}`,
          },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: { credit: { increment: quest.creditReward } },
        }),
      ]);
    }
  }

  private today(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
