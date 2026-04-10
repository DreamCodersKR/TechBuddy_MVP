import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserPlan, CreditTransactionType } from '@prisma/client';
import { AdminUsersQueryDto, AdjustCreditsDto } from './dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 유저 목록 ──────────────────────────────────────────────────
  async getUsers(query: AdminUsersQueryDto) {
    const { search, plan, role, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nickname: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (plan) where.plan = plan;
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          nickname: true,
          role: true,
          plan: true,
          credit: true,
          xp: true,
          level: true,
          isBanned: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── 유저 상세 ──────────────────────────────────────────────────
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        role: true,
        plan: true,
        credit: true,
        xp: true,
        level: true,
        bio: true,
        techStack: true,
        avatarUrl: true,
        githubUrl: true,
        isBanned: true,
        bannedAt: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            posts: true,
            agoraQuestions: true,
            aiConversations: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');
    return user;
  }

  // ── 역할 변경 (SUPER_ADMIN만 호출 가능) ───────────────────────
  async updateUserRole(targetId: string, role: UserRole, requesterId: string) {
    const requester = await this.prisma.user.findUnique({ where: { id: requesterId } });
    if (requester?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('역할 변경은 SUPER_ADMIN만 가능합니다.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    return this.prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
  }

  // ── 플랜 변경 ──────────────────────────────────────────────────
  async updateUserPlan(targetId: string, plan: UserPlan) {
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    return this.prisma.user.update({
      where: { id: targetId },
      data: { plan },
      select: { id: true, email: true, plan: true },
    });
  }

  // ── 크레딧 수동 지급/차감 ──────────────────────────────────────
  async adjustCredits(targetId: string, dto: AdjustCreditsDto) {
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    const type = dto.amount >= 0 ? CreditTransactionType.EARN : CreditTransactionType.SPEND;

    const [updatedUser] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetId },
        data: { credit: { increment: dto.amount } },
        select: { id: true, email: true, credit: true },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId: targetId,
          type,
          amount: Math.abs(dto.amount),
          description: `[관리자] ${dto.reason}`,
        },
      }),
    ]);

    return updatedUser;
  }

  // ── 계정 정지 / 해제 ───────────────────────────────────────────
  async banUser(targetId: string, ban: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new NotFoundException('유저를 찾을 수 없습니다.');

    return this.prisma.user.update({
      where: { id: targetId },
      data: {
        isBanned: ban,
        bannedAt: ban ? new Date() : null,
      },
      select: { id: true, email: true, isBanned: true, bannedAt: true },
    });
  }

  // ── 서비스 통계 ────────────────────────────────────────────────
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      newUsersToday,
      planDistribution,
      totalPosts,
      totalAgoraQuestions,
      totalAiConversations,
      openInquiries,
      pendingReports,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.groupBy({ by: ['plan'], _count: { id: true } }),
      this.prisma.post.count(),
      this.prisma.agora.count(),
      this.prisma.aIConversation.count(),
      this.prisma.inquiry.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        byPlan: planDistribution.reduce(
          (acc, item) => ({ ...acc, [item.plan]: item._count.id }),
          {} as Record<string, number>,
        ),
      },
      content: {
        posts: totalPosts,
        agoraQuestions: totalAgoraQuestions,
        aiConversations: totalAiConversations,
      },
      operations: {
        openInquiries,
        pendingReports,
      },
    };
  }

  // ── 콘텐츠 검열 (숨겨진 콘텐츠 관리) ──────────────────────────
  async getModerationList(type?: string) {
    const results: any[] = [];

    if (!type || type === 'post') {
      const posts = await this.prisma.post.findMany({
        where: { isHidden: true },
        include: { author: { select: { id: true, nickname: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      results.push(...posts.map((p) => ({ ...p, contentType: 'post' })));
    }

    if (!type || type === 'comment') {
      const comments = await this.prisma.postComment.findMany({
        where: { isHidden: true },
        include: { author: { select: { id: true, nickname: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      results.push(...comments.map((c) => ({ ...c, contentType: 'comment' })));
    }

    if (!type || type === 'agora') {
      const agoras = await this.prisma.agora.findMany({
        where: { isHidden: true },
        include: { author: { select: { id: true, nickname: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      results.push(...agoras.map((a) => ({ ...a, contentType: 'agora' })));
    }

    if (!type || type === 'agoraAnswer') {
      const answers = await this.prisma.agoraAnswer.findMany({
        where: { isHidden: true },
        include: { author: { select: { id: true, nickname: true, email: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      results.push(...answers.map((a) => ({ ...a, contentType: 'agoraAnswer' })));
    }

    return results;
  }

  async restoreContent(type: string, id: string) {
    switch (type) {
      case 'post':
        return this.prisma.post.update({ where: { id }, data: { isHidden: false } });
      case 'comment':
        return this.prisma.postComment.update({ where: { id }, data: { isHidden: false } });
      case 'agora':
        return this.prisma.agora.update({ where: { id }, data: { isHidden: false } });
      case 'agoraAnswer':
        return this.prisma.agoraAnswer.update({ where: { id }, data: { isHidden: false } });
      default:
        throw new BadRequestException('Invalid content type');
    }
  }
}
