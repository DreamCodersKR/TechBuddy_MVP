import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto, TIER_COST, MentoringTier } from './dto/create-message.dto';
import { AIMessageRole, CreditTransactionType, UserPlan } from '@prisma/client';

// 모델 라우팅 매트릭스 (기능정의서 기준)
const MODEL_MATRIX = {
  CODE:     { 1: 'claude-haiku-4-5',          2: 'gpt-5.4-mini',        3: 'claude-opus-4-6' },
  DOCUMENT: { 1: 'gemini-2.5-flash-lite',      2: 'gpt-5.4-mini',        3: 'claude-opus-4-6' },
  DESIGN:   { 1: 'gemini-2.5-flash-lite',      2: 'gemini-3-flash',       3: 'gemini-3.1-pro' },
  PLANNING: { 1: 'claude-haiku-4-5',          2: 'claude-sonnet-4-6',   3: 'claude-opus-4-6' },
  RESEARCH: { 1: 'grok-4-1-fast',             2: 'grok-4-1-fast',       3: 'grok-4.20' },
  OTHER:    { 1: 'gemini-2.5-flash-lite',      2: 'gemini-3-flash',       3: 'gemini-3.1-pro' },
};

// 플랜별 허용 등급
const PLAN_MAX_TIER = {
  [UserPlan.FREE]:    MentoringTier.BASIC,
  [UserPlan.PRO]:     MentoringTier.ADVANCED,
  [UserPlan.PREMIUM]: MentoringTier.EXPERT,
};

@Injectable()
export class AiMentorService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    return this.prisma.aIConversation.findMany({
      where: { userId },
      include: { _count: { select: { messages: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getConversation(conversationId: string, userId: string) {
    const conv = await this.prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conv) throw new NotFoundException('대화를 찾을 수 없습니다');
    if (conv.userId !== userId) throw new ForbiddenException('접근 권한이 없습니다');
    return conv;
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conv = await this.prisma.aIConversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('대화를 찾을 수 없습니다');
    if (conv.userId !== userId) throw new ForbiddenException('접근 권한이 없습니다');
    await this.prisma.aIConversation.delete({ where: { id: conversationId } });
    return { message: '대화가 삭제되었습니다' };
  }

  async sendMessage(
    conversationId: string | null,
    userId: string,
    dto: CreateMessageDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');

    // 플랜별 등급 제한
    const maxTier = PLAN_MAX_TIER[user.plan];
    if (dto.tier > maxTier)
      throw new ForbiddenException(`현재 플랜(${user.plan})에서는 ${dto.tier}등급을 사용할 수 없습니다`);

    const cost = TIER_COST[dto.tier];
    if (user.credit < cost)
      throw new BadRequestException(`크레딧이 부족합니다 (필요: ${cost}cr, 보유: ${user.credit}cr)`);

    const modelUsed = MODEL_MATRIX[dto.taskType]?.[dto.tier] ?? 'claude-haiku-4-5';

    // 대화 세션 생성 or 기존 사용
    let convId = conversationId;
    if (!convId) {
      const conv = await this.prisma.aIConversation.create({
        data: {
          userId,
          title: dto.content.slice(0, 50),
          taskId: dto.taskId,
        },
      });
      convId = conv.id;
    } else {
      const existing = await this.prisma.aIConversation.findUnique({ where: { id: convId } });
      if (!existing || existing.userId !== userId)
        throw new NotFoundException('대화를 찾을 수 없습니다');
    }

    // 트랜잭션: 유저 메시지 저장 + 크레딧 차감 + AI 응답 저장 (stub)
    await this.prisma.$transaction(async (tx) => {
      // 유저 메시지 저장
      await tx.aIMessage.create({
        data: {
          conversationId: convId!,
          role: AIMessageRole.USER,
          content: dto.content,
          taskType: dto.taskType,
          modelUsed,
          creditsUsed: 0,
        },
      });

      // 크레딧 차감
      await tx.user.update({ where: { id: userId }, data: { credit: { decrement: cost } } });
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -cost,
          type: CreditTransactionType.SPEND,
          description: `AI멘토링 (${modelUsed}, ${dto.taskType} ${dto.tier}등급)`,
          relatedId: convId,
        },
      });

      // TODO: 실제 AI 연동 (SSE 스트리밍)
      // 현재는 stub 응답 저장
      await tx.aIMessage.create({
        data: {
          conversationId: convId!,
          role: AIMessageRole.ASSISTANT,
          content: `[${modelUsed}] AI 응답 준비 중입니다. (실제 AI 연동은 별도 구현 예정)`,
          taskType: dto.taskType,
          modelUsed,
          creditsUsed: cost,
        },
      });

      // 대화 updatedAt 갱신
      await tx.aIConversation.update({ where: { id: convId! }, data: { updatedAt: new Date() } });
    });

    return { conversationId: convId, model: modelUsed, creditsUsed: cost };
  }
}
