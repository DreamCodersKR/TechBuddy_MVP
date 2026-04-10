import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateCoffeeChatDto } from './dto/create-coffee-chat.dto';
import { AcceptCoffeeChatDto } from './dto/accept-coffee-chat.dto';
import { CreditTransactionType, NotificationType } from '@prisma/client';

const COFFEE_CHAT_CREDIT_COST = 10;

const USER_SELECT = {
  id: true,
  nickname: true,
  avatarUrl: true,
  techStack: true,
};

@Injectable()
export class CoffeeChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationService,
  ) {}

  /**
   * 커피챗 요청 생성
   */
  async create(requesterId: string, dto: CreateCoffeeChatDto) {
    // 자기 자신에게 요청 불가
    if (requesterId === dto.receiverId) {
      throw new BadRequestException('자기 자신에게 커피챗을 요청할 수 없습니다');
    }

    // 받는 사람 존재 확인
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.receiverId },
      select: { id: true, nickname: true },
    });
    if (!receiver) {
      throw new NotFoundException('받는 사람을 찾을 수 없습니다');
    }

    // 이미 PENDING 상태의 요청이 있는지 확인
    const existingPending = await this.prisma.coffeeChat.findFirst({
      where: {
        requesterId,
        receiverId: dto.receiverId,
        status: 'PENDING',
      },
    });
    if (existingPending) {
      throw new BadRequestException('이미 대기 중인 커피챗 요청이 있습니다');
    }

    // 크레딧 잔액 확인
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { credit: true, nickname: true },
    });
    if (!requester || requester.credit < COFFEE_CHAT_CREDIT_COST) {
      throw new BadRequestException(
        `크레딧이 부족합니다 (필요: ${COFFEE_CHAT_CREDIT_COST}, 보유: ${requester?.credit ?? 0})`,
      );
    }

    // 트랜잭션: 커피챗 생성 + 크레딧 차감 + 크레딧 거래 기록
    const coffeeChat = await this.prisma.$transaction(async (tx) => {
      // 크레딧 차감
      await tx.user.update({
        where: { id: requesterId },
        data: { credit: { decrement: COFFEE_CHAT_CREDIT_COST } },
      });

      // 크레딧 거래 기록
      await tx.creditTransaction.create({
        data: {
          userId: requesterId,
          amount: -COFFEE_CHAT_CREDIT_COST,
          type: CreditTransactionType.SPEND,
          description: `커피챗 요청 (${receiver.nickname ?? '사용자'})`,
        },
      });

      // 커피챗 생성
      return tx.coffeeChat.create({
        data: {
          requesterId,
          receiverId: dto.receiverId,
          message: dto.message,
          creditCost: COFFEE_CHAT_CREDIT_COST,
        },
        include: {
          requester: { select: USER_SELECT },
          receiver: { select: USER_SELECT },
        },
      });
    });

    // 알림 발송 (트랜잭션 외부 - 실패해도 무시)
    await this.notification.create({
      recipientId: dto.receiverId,
      senderId: requesterId,
      type: 'COFFEE_CHAT_REQUESTED' as NotificationType,
      title: '커피챗 요청',
      message: `${requester.nickname ?? '사용자'}님이 커피챗을 요청했습니다`,
      relatedId: coffeeChat.id,
    }).catch(() => {});

    return coffeeChat;
  }

  /**
   * 내 커피챗 목록 조회
   */
  async findMine(userId: string, role?: string) {
    let where: any;

    if (role === 'sent') {
      where = { requesterId: userId };
    } else if (role === 'received') {
      where = { receiverId: userId };
    } else {
      where = {
        OR: [{ requesterId: userId }, { receiverId: userId }],
      };
    }

    const items = await this.prisma.coffeeChat.findMany({
      where,
      include: {
        requester: { select: USER_SELECT },
        receiver: { select: USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: items };
  }

  /**
   * 커피챗 수락
   */
  async accept(id: string, userId: string, dto: AcceptCoffeeChatDto) {
    const coffeeChat = await this.prisma.coffeeChat.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, nickname: true } },
        receiver: { select: { id: true, nickname: true } },
      },
    });
    if (!coffeeChat) {
      throw new NotFoundException('커피챗을 찾을 수 없습니다');
    }
    if (coffeeChat.receiverId !== userId) {
      throw new ForbiddenException('받은 요청만 수락할 수 있습니다');
    }
    if (coffeeChat.status !== 'PENDING') {
      throw new BadRequestException('대기 중인 요청만 수락할 수 있습니다');
    }

    const updated = await this.prisma.coffeeChat.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        ...(dto.meetingUrl && { meetingUrl: dto.meetingUrl }),
      },
      include: {
        requester: { select: USER_SELECT },
        receiver: { select: USER_SELECT },
      },
    });

    // 요청자에게 알림
    await this.notification.create({
      recipientId: coffeeChat.requesterId,
      senderId: userId,
      type: 'COFFEE_CHAT_ACCEPTED' as NotificationType,
      title: '커피챗 수락',
      message: `${coffeeChat.receiver.nickname ?? '사용자'}님이 커피챗을 수락했습니다`,
      relatedId: id,
    }).catch(() => {});

    return updated;
  }

  /**
   * 커피챗 거절 (크레딧 환불)
   */
  async decline(id: string, userId: string) {
    const coffeeChat = await this.prisma.coffeeChat.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, nickname: true } },
        receiver: { select: { id: true, nickname: true } },
      },
    });
    if (!coffeeChat) {
      throw new NotFoundException('커피챗을 찾을 수 없습니다');
    }
    if (coffeeChat.receiverId !== userId) {
      throw new ForbiddenException('받은 요청만 거절할 수 있습니다');
    }
    if (coffeeChat.status !== 'PENDING') {
      throw new BadRequestException('대기 중인 요청만 거절할 수 있습니다');
    }

    // 트랜잭션: 상태 변경 + 크레딧 환불
    const updated = await this.prisma.$transaction(async (tx) => {
      // 상태 변경
      const chat = await tx.coffeeChat.update({
        where: { id },
        data: { status: 'DECLINED' },
        include: {
          requester: { select: USER_SELECT },
          receiver: { select: USER_SELECT },
        },
      });

      // 크레딧 환불
      await tx.user.update({
        where: { id: coffeeChat.requesterId },
        data: { credit: { increment: coffeeChat.creditCost } },
      });

      // 환불 거래 기록
      await tx.creditTransaction.create({
        data: {
          userId: coffeeChat.requesterId,
          amount: coffeeChat.creditCost,
          type: CreditTransactionType.REFUND,
          description: `커피챗 거절 환불 (${coffeeChat.receiver.nickname ?? '사용자'})`,
          relatedId: id,
        },
      });

      return chat;
    });

    // 요청자에게 알림
    await this.notification.create({
      recipientId: coffeeChat.requesterId,
      senderId: userId,
      type: 'COFFEE_CHAT_DECLINED' as NotificationType,
      title: '커피챗 거절',
      message: `${coffeeChat.receiver.nickname ?? '사용자'}님이 커피챗을 거절했습니다. 크레딧이 환불되었습니다.`,
      relatedId: id,
    }).catch(() => {});

    return updated;
  }

  /**
   * 커피챗 취소 (요청자가 직접, 크레딧 환불)
   */
  async cancel(id: string, userId: string) {
    const coffeeChat = await this.prisma.coffeeChat.findUnique({
      where: { id },
      include: {
        receiver: { select: { id: true, nickname: true } },
      },
    });
    if (!coffeeChat) {
      throw new NotFoundException('커피챗을 찾을 수 없습니다');
    }
    if (coffeeChat.requesterId !== userId) {
      throw new ForbiddenException('본인이 보낸 요청만 취소할 수 있습니다');
    }
    if (coffeeChat.status !== 'PENDING') {
      throw new BadRequestException('대기 중인 요청만 취소할 수 있습니다');
    }

    // 트랜잭션: 상태 변경 + 크레딧 환불
    const updated = await this.prisma.$transaction(async (tx) => {
      // 상태 변경
      const chat = await tx.coffeeChat.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          requester: { select: USER_SELECT },
          receiver: { select: USER_SELECT },
        },
      });

      // 크레딧 환불
      await tx.user.update({
        where: { id: userId },
        data: { credit: { increment: coffeeChat.creditCost } },
      });

      // 환불 거래 기록
      await tx.creditTransaction.create({
        data: {
          userId,
          amount: coffeeChat.creditCost,
          type: CreditTransactionType.REFUND,
          description: `커피챗 취소 환불`,
          relatedId: id,
        },
      });

      return chat;
    });

    return updated;
  }
}
