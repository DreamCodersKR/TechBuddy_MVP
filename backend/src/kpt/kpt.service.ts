import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertKptDto } from './dto/upsert-kpt.dto';

@Injectable()
export class KptService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /** 스프린트 존재 확인 + 반환 */
  private async getSprint(sprintId: string) {
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      select: { id: true, projectId: true },
    });
    if (!sprint) throw new NotFoundException('스프린트를 찾을 수 없습니다');
    return sprint;
  }

  /** 프로젝트 멤버 확인 */
  private async checkMember(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new ForbiddenException('워크스페이스 멤버가 아닙니다');
  }

  // ─── 내 KPT 작성/수정 (Upsert) ──────────────────────────────
  async upsert(sprintId: string, userId: string, dto: UpsertKptDto) {
    const sprint = await this.getSprint(sprintId);
    await this.checkMember(sprint.projectId, userId);

    return this.prisma.$queryRaw`
      INSERT INTO "kpt_retrospectives" ("id", "sprintId", "userId", "keeps", "problems", "tries", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${sprintId}, ${userId}, ${dto.keeps}, ${dto.problems}, ${dto.tries}, NOW(), NOW())
      ON CONFLICT ("sprintId", "userId")
      DO UPDATE SET
        "keeps" = ${dto.keeps},
        "problems" = ${dto.problems},
        "tries" = ${dto.tries},
        "updatedAt" = NOW()
      RETURNING *
    `.then((rows: any[]) => rows[0]);
  }

  // ─── 스프린트 전체 KPT 조회 ──────────────────────────────────
  async findBySprintId(sprintId: string, userId: string) {
    const sprint = await this.getSprint(sprintId);
    await this.checkMember(sprint.projectId, userId);

    const retrospectives = await this.prisma.$queryRaw<any[]>`
      SELECT
        r."id", r."sprintId", r."userId", r."keeps", r."problems", r."tries",
        r."createdAt", r."updatedAt",
        json_build_object('id', u."id", 'nickname', u."nickname", 'avatarUrl', u."avatarUrl") AS "user"
      FROM "kpt_retrospectives" r
      JOIN "users" u ON u."id" = r."userId"
      WHERE r."sprintId" = ${sprintId}
      ORDER BY r."createdAt" ASC
    `;

    const summaryRows = await this.prisma.$queryRaw<any[]>`
      SELECT "id", "sprintId", "summary", "createdAt"
      FROM "kpt_summaries"
      WHERE "sprintId" = ${sprintId}
      LIMIT 1
    `;

    return {
      retrospectives,
      summary: summaryRows[0]?.summary ?? null,
    };
  }

  // ─── AI 요약 생성 (Gemini Flash-Lite) ────────────────────────
  async generateSummary(sprintId: string, userId: string) {
    const sprint = await this.getSprint(sprintId);
    await this.checkMember(sprint.projectId, userId);

    const retrospectives = await this.prisma.$queryRaw<any[]>`
      SELECT r."keeps", r."problems", r."tries",
        u."nickname"
      FROM "kpt_retrospectives" r
      JOIN "users" u ON u."id" = r."userId"
      WHERE r."sprintId" = ${sprintId}
    `;

    if (retrospectives.length === 0) {
      throw new BadRequestException('회고가 없습니다');
    }

    // KPT 데이터를 프롬프트용 텍스트로 조합
    const kptText = retrospectives
      .map((r) => {
        const lines: string[] = [`[${r.nickname}]`];
        if (r.keeps?.length) lines.push(`Keep: ${r.keeps.join(', ')}`);
        if (r.problems?.length) lines.push(`Problem: ${r.problems.join(', ')}`);
        if (r.tries?.length) lines.push(`Try: ${r.tries.join(', ')}`);
        return lines.join('\n');
      })
      .join('\n\n');

    const prompt = `다음은 스프린트 회고 KPT입니다. 핵심 인사이트 3가지와 다음 스프린트 추천 액션 3가지를 한국어로 요약해주세요.\n\n${kptText}`;

    let summaryText: string;
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.config.get<string>('GEMINI_API_KEY')!);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      const result = await model.generateContent(prompt);
      summaryText = result.response.text().trim();
    } catch (err) {
      throw new InternalServerErrorException(`AI 요약 생성 실패: ${(err as Error).message}`);
    }

    // KptSummary upsert (sprintId unique)
    await this.prisma.$queryRaw`
      INSERT INTO "kpt_summaries" ("id", "sprintId", "summary", "createdAt")
      VALUES (gen_random_uuid(), ${sprintId}, ${summaryText}, NOW())
      ON CONFLICT ("sprintId")
      DO UPDATE SET "summary" = ${summaryText}, "createdAt" = NOW()
    `;

    return { sprintId, summary: summaryText };
  }
}
