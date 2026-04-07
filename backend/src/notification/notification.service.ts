import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 알림 생성 (내부용)
   */
  async create(params: {
    recipientId: string;
    senderId?: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedId?: string;
  }) {
    // 자신에게는 알림 미발송
    if (params.senderId && params.senderId === params.recipientId) return;

    return this.prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        senderId: params.senderId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedId: params.relatedId,
      },
    });
  }

  /**
   * 내 알림 목록 조회 (최신순, 페이지네이션)
   */
  async findMyNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, name: true, nickname: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.notification.count({ where: { recipientId: userId } }),
      this.prisma.notification.count({
        where: { recipientId: userId, isRead: false },
      }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  /**
   * 미읽음 개수
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
    return { count };
  }

  /**
   * 단일 읽음 처리
   */
  async markAsRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { isRead: true },
    });
    return { message: '읽음 처리되었습니다' };
  }

  /**
   * 전체 읽음 처리
   */
  async markAllAsRead(userId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
    return { message: `${count}개의 알림을 읽음 처리했습니다` };
  }
}
