import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from '../xp/xp.service';
import { NotificationService } from '../notification/notification.service';
import { QuestService, QUEST_KEYS } from '../quest/quest.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreateAgoraDto } from './dto/create-agora.dto';
import { CreateAgoraAnswerDto } from './dto/create-agora-answer.dto';
import { AgoraStatus, CreditTransactionType, NotificationType, UserPlan } from '@prisma/client';

const AGORA_MONTHLY_LIMITS: Partial<Record<UserPlan, number>> = {
  [UserPlan.FREE]: 3,
};

@Injectable()
export class AgoraService {
  constructor(
    private prisma: PrismaService,
    private readonly xp: XpService,
    private readonly notification: NotificationService,
    private readonly quest: QuestService,
    private readonly moderation: ModerationService,
  ) {}

  // ========================
  // 질문 CRUD
  // ========================

  async findAll(params: { query?: string; status?: string; page?: number; limit?: number }) {
    const { query, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status: status as AgoraStatus }),
      ...(query && {
        OR: [
          { title: { contains: query, mode: 'insensitive' as const } },
          { content: { contains: query, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.agora.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
          _count: { select: { answers: true } },
        },
      }),
      this.prisma.agora.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const agora = await this.prisma.agora.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, nickname: true, avatarUrl: true, userBadges: { select: { badge: true } } } },
        answers: {
          include: {
            author: { select: { id: true, name: true, nickname: true, avatarUrl: true, userBadges: { select: { badge: true } } } },
          },
          orderBy: [{ isAccepted: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!agora) throw new NotFoundException('질문을 찾을 수 없습니다');

    // 조회수 증가
    await this.prisma.agora.update({ where: { id }, data: { viewCount: { increment: 1 } } });

    return agora;
  }

  async create(userId: string, dto: CreateAgoraDto) {
    // 크레딧 확인
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    if (user.credit < dto.bounty)
      throw new BadRequestException('크레딧이 부족합니다');

    // 플랜별 월 질문 횟수 제한
    const monthlyLimit = AGORA_MONTHLY_LIMITS[user.plan];
    if (monthlyLimit !== undefined) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const count = await this.prisma.agora.count({
        where: { authorId: userId, createdAt: { gte: startOfMonth } },
      });
      if (count >= monthlyLimit) {
        throw new ForbiddenException(
          `무료 플랜은 아고라 질문을 월 ${monthlyLimit}회까지 작성할 수 있습니다. Pro 플랜으로 업그레이드하세요.`,
        );
      }
    }

    // 트랜잭션: 질문 생성 + 크레딧 차감 + 거래내역
    const agora = await this.prisma.$transaction(async (tx) => {
      const created = await tx.agora.create({
        data: { ...dto, authorId: userId },
      });
      await tx.user.update({
        where: { id: userId },
        data: { credit: { decrement: dto.bounty } },
      });
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -dto.bounty,
          type: CreditTransactionType.SPEND,
          description: `아고라 현상금 - ${dto.title}`,
          relatedId: created.id,
        },
      });
      return created;
    });

    // XP 부여: 질문 등록 +10
    await this.xp.grantXP(userId, 10);

    // AI 콘텐츠 검열 (fire-and-forget)
    this.moderation.moderateAgora(agora.id).catch(() => {});

    return agora;
  }

  async remove(id: string, userId: string) {
    const agora = await this.prisma.agora.findUnique({
      where: { id },
      include: { _count: { select: { answers: true } } },
    });

    if (!agora) throw new NotFoundException('질문을 찾을 수 없습니다');
    if (agora.authorId !== userId) throw new ForbiddenException('삭제 권한이 없습니다');
    if (agora._count.answers > 0)
      throw new ForbiddenException('답변이 달린 질문은 삭제할 수 없습니다');
    if (agora.status === AgoraStatus.CLOSED)
      throw new ForbiddenException('채택 완료된 질문은 삭제할 수 없습니다');

    // 트랜잭션: 삭제 + 현상금 환불
    await this.prisma.$transaction(async (tx) => {
      await tx.agora.delete({ where: { id } });
      await tx.user.update({
        where: { id: userId },
        data: { credit: { increment: agora.bounty } },
      });
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: agora.bounty,
          type: CreditTransactionType.REFUND,
          description: `아고라 현상금 환불 - ${agora.title}`,
          relatedId: id,
        },
      });
    });

    return { message: '질문이 삭제되었습니다 (현상금 환불 완료)' };
  }

  // ========================
  // 답변 CRUD
  // ========================

  async createAnswer(agoraId: string, userId: string, dto: CreateAgoraAnswerDto) {
    const agora = await this.prisma.agora.findUnique({ where: { id: agoraId } });
    if (!agora) throw new NotFoundException('질문을 찾을 수 없습니다');
    if (agora.status === AgoraStatus.CLOSED)
      throw new ForbiddenException('채택 완료된 질문에는 답변할 수 없습니다');
    if (agora.authorId === userId)
      throw new ForbiddenException('본인 질문에는 답변할 수 없습니다');

    const answer = await this.prisma.agoraAnswer.create({
      data: { ...dto, agoraId, authorId: userId },
      include: {
        author: { select: { id: true, name: true, nickname: true, avatarUrl: true, userBadges: { select: { badge: true } } } },
      },
    });

    // 알림: 질문자에게 답변 알림
    await this.notification.create({
      recipientId: agora.authorId,
      senderId: userId,
      type: NotificationType.AGORA_ANSWERED,
      title: '아고라에 답변이 달렸어요',
      message: `"${agora.title}"에 새 답변이 등록되었습니다`,
      relatedId: agoraId,
    });

    // 퀘스트 체크: 아고라 답변
    await this.quest.checkAndComplete(userId, QUEST_KEYS.AGORA_ANSWER);

    // AI 콘텐츠 검열 (fire-and-forget)
    this.moderation.moderateAgoraAnswer(answer.id).catch(() => {});

    return answer;
  }

  async removeAnswer(agoraId: string, answerId: string, userId: string) {
    const answer = await this.prisma.agoraAnswer.findUnique({ where: { id: answerId } });
    if (!answer || answer.agoraId !== agoraId)
      throw new NotFoundException('답변을 찾을 수 없습니다');
    if (answer.authorId !== userId) throw new ForbiddenException('삭제 권한이 없습니다');
    if (answer.isAccepted) throw new ForbiddenException('채택된 답변은 삭제할 수 없습니다');

    await this.prisma.agoraAnswer.delete({ where: { id: answerId } });
    return { message: '답변이 삭제되었습니다' };
  }

  // ========================
  // 채택
  // ========================

  async acceptAnswer(agoraId: string, answerId: string, userId: string) {
    const agora = await this.prisma.agora.findUnique({
      where: { id: agoraId },
      include: { _count: { select: { answers: true } } },
    });
    if (!agora) throw new NotFoundException('질문을 찾을 수 없습니다');
    if (agora.authorId !== userId) throw new ForbiddenException('질문 작성자만 채택할 수 있습니다');
    if (agora.status === AgoraStatus.CLOSED)
      throw new ForbiddenException('이미 채택 완료된 질문입니다');

    const answer = await this.prisma.agoraAnswer.findUnique({ where: { id: answerId } });
    if (!answer || answer.agoraId !== agoraId)
      throw new NotFoundException('답변을 찾을 수 없습니다');

    // 트랜잭션: 채택 + 현상금 지급 + 크레딧 거래내역
    await this.prisma.$transaction(async (tx) => {
      await tx.agoraAnswer.update({ where: { id: answerId }, data: { isAccepted: true } });
      await tx.agora.update({ where: { id: agoraId }, data: { status: AgoraStatus.CLOSED } });
      await tx.user.update({
        where: { id: answer.authorId },
        data: { credit: { increment: agora.bounty } },
      });
      await tx.creditTransaction.create({
        data: {
          userId: answer.authorId,
          amount: agora.bounty,
          type: CreditTransactionType.EARN,
          description: `아고라 답변 채택 현상금 - ${agora.title}`,
          relatedId: agoraId,
        },
      });
    });

    // XP 부여: 답변 채택 +100 (레벨 계산 포함)
    await this.xp.grantXP(answer.authorId, 100);

    // 알림: 답변자에게 채택 알림
    await this.notification.create({
      recipientId: answer.authorId,
      senderId: userId,
      type: NotificationType.AGORA_ACCEPTED,
      title: '내 답변이 채택됐어요! 🎉',
      message: `"${agora.title}" 질문에서 답변이 채택되어 ${agora.bounty}C를 받았습니다`,
      relatedId: agoraId,
    });

    return { message: '답변이 채택되었습니다' };
  }
}
