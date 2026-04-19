import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { SprintStatus } from '@prisma/client';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notification: NotificationService,
  ) {}

  /**
   * 공개 포트폴리오 데이터 조회 (GET /portfolio/:nickname)
   * 인증 불필요
   */
  async getPortfolio(nickname: string) {
    const user = await this.prisma.user.findUnique({
      where: { nickname },
      select: {
        id: true,
        nickname: true,
        name: true,
        bio: true,
        avatarUrl: true,
        displayBadgeType: true,
        level: true,
        techStack: true,
        githubUrl: true,
        portfolioUrl: true,
        portfolioPublic: true,
        portfolioSections: true,
        currentStreak: true,
        userBadges: {
          select: { badge: true, earnedAt: true },
          orderBy: { earnedAt: 'desc' },
        },
        tils: {
          where: { visibility: { not: 'PRIVATE' } },
          select: { date: true },
          orderBy: { date: 'desc' },
        },
        projectMemberships: {
          select: {
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                techStack: true,
                type: true,
                _count: { select: { members: true } },
                sprints: {
                  where: { status: SprintStatus.COMPLETED },
                  select: { id: true },
                },
                documents: {
                  select: { id: true },
                  take: 1,
                },
                tasks: {
                  where: { status: 'DONE' },
                  select: { id: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    if (!user.portfolioPublic) throw new NotFoundException('비공개 포트폴리오입니다');

    const sections = (user.portfolioSections as any) ?? {
      stats: true,
      grass: true,
      projects: true,
      badges: true,
      recentTILs: true,
    };

    // 활동 히트맵 집계 (TIL + DONE Task)
    const activityHeatmap = await this.buildActivityHeatmap(user.id, user.tils.map((t) => t.date));

    // 아고라 채택 수
    const agoraAccepted = await this.prisma.agoraAnswer.count({
      where: { authorId: user.id, isAccepted: true },
    });

    // 프로젝트 카드 (Verified 판정 포함)
    const projects = user.projectMemberships
      .map(({ project }) => {
        const completedSprintCount = project.sprints.length;
        const memberCount = project._count.members;
        const hasDocument = project.documents.length > 0;
        const isVerified =
          completedSprintCount >= 2 && memberCount >= 2 && hasDocument;

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          techStack: project.techStack,
          type: project.type,
          isVerified,
          memberCount,
          taskCompletedCount: project.tasks.length,
        };
      })
      .filter((p) => p.type === 'PROJECT'); // STUDY 워크스페이스는 제외

    // 최근 TIL (공개)
    const recentTILs = await this.prisma.til.findMany({
      where: { authorId: user.id, visibility: { not: 'PRIVATE' } },
      select: { id: true, title: true, content: true, date: true },
      orderBy: { date: 'desc' },
      take: 5,
    });

    return {
      user: {
        nickname: user.nickname,
        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        level: user.level,
        techStack: user.techStack,
        githubUrl: user.githubUrl,
        portfolioUrl: user.portfolioUrl,
      },
      sections,
      stats: sections.stats
        ? {
            totalTIL: user.tils.length,
            streakDays: user.currentStreak,
            agoraAccepted,
            projectCount: projects.length,
          }
        : null,
      activityHeatmap: sections.grass ? activityHeatmap : null,
      projects: sections.projects ? projects : null,
      badges: sections.badges ? user.userBadges : null,
      recentTILs: sections.recentTILs ? recentTILs : null,
    };
  }

  /**
   * 활동 히트맵 빌드 (TIL + DONE Task + 게시글 + 댓글 + AI 세션 합산)
   */
  private async buildActivityHeatmap(
    userId: string,
    tilDates: Date[],
  ): Promise<Record<string, number>> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1);
    const endDate = new Date(now.getFullYear() + 1, 0, 1);

    const dateRange = { gte: startDate, lt: endDate };

    const [doneTasks, posts, comments, aiSessions] = await Promise.all([
      this.prisma.task.findMany({
        where: { assigneeId: userId, status: 'DONE', updatedAt: dateRange },
        select: { updatedAt: true },
      }),
      this.prisma.post.findMany({
        where: { authorId: userId, createdAt: dateRange },
        select: { createdAt: true },
      }),
      this.prisma.postComment.findMany({
        where: { authorId: userId, createdAt: dateRange },
        select: { createdAt: true },
      }),
      this.prisma.aIConversation.findMany({
        where: { userId, createdAt: dateRange },
        select: { createdAt: true },
      }),
    ]);

    const heatmap: Record<string, number> = {};
    const add = (d: Date) => {
      const key = d.toISOString().slice(0, 10);
      heatmap[key] = (heatmap[key] ?? 0) + 1;
    };

    tilDates.forEach((d) => add(d));
    doneTasks.forEach((t) => add(t.updatedAt));
    posts.forEach((t) => add(t.createdAt));
    comments.forEach((t) => add(t.createdAt));
    aiSessions.forEach((t) => add(t.createdAt));

    return heatmap;
  }

  /**
   * 포트폴리오 공개 설정 업데이트 (PATCH /portfolio/settings)
   */
  async updateSettings(
    userId: string,
    dto: { portfolioPublic?: boolean; portfolioSections?: Record<string, boolean> },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        portfolioPublic: dto.portfolioPublic,
        portfolioSections: dto.portfolioSections,
      },
      select: {
        portfolioPublic: true,
        portfolioSections: true,
        nickname: true,
      },
    });
  }

  /**
   * 내 포트폴리오 설정 조회 (GET /portfolio/settings)
   */
  async getMySettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        portfolioPublic: true,
        portfolioSections: true,
        nickname: true,
      },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user;
  }

  /**
   * Verified Project 판정 - 프로젝트 상태/문서 변경 시 호출
   * 조건 충족 시 알림 발송
   */
  async checkAndNotifyVerified(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        createdById: true,
        _count: { select: { members: true } },
        sprints: {
          where: { status: SprintStatus.COMPLETED },
          select: { id: true },
        },
        documents: { select: { id: true }, take: 1 },
      },
    });

    if (!project) return;

    const isVerified =
      project.sprints.length >= 2 &&
      project._count.members >= 2 &&
      project.documents.length > 0;

    if (isVerified) {
      await this.notification.create({
        recipientId: project.createdById,
        type: 'PROJECT_VERIFIED',
        title: '프로젝트 Verified 인증 달성!',
        message: `"${project.name}" 프로젝트가 Verified 인증을 받았어요! 🎉`,
        relatedId: project.id,
      });
    }

    return isVerified;
  }

  /**
   * 프로젝트 Verified 상태 조회 (워크스페이스 헤더용)
   */
  async getProjectVerifiedStatus(projectId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        _count: { select: { members: true } },
        sprints: {
          where: { status: SprintStatus.COMPLETED },
          select: { id: true },
        },
        documents: { select: { id: true }, take: 1 },
      },
    });

    if (!project) return false;

    return (
      project.sprints.length >= 2 &&
      project._count.members >= 2 &&
      project.documents.length > 0
    );
  }
}
