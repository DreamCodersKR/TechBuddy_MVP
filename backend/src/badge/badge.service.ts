import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeType } from '@prisma/client';

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 뱃지 부여 (중복 무시: @@unique([userId, badge]))
   */
  async awardBadge(userId: string, badge: BadgeType) {
    try {
      await this.prisma.userBadge.create({ data: { userId, badge } });
      this.logger.log(`Badge ${badge} awarded to ${userId}`);
    } catch {
      // 이미 획득한 뱃지 → 무시
    }
  }

  /**
   * 뱃지 회수 (구독 해지 시)
   */
  async revokeBadge(userId: string, badge: BadgeType) {
    await this.prisma.userBadge.deleteMany({
      where: { userId, badge },
    });

    // displayBadgeType이 회수된 뱃지였으면 null로 리셋
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { displayBadgeType: true },
    });
    if (user?.displayBadgeType === badge) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { displayBadgeType: null },
      });
    }
  }

  /**
   * 미보유 뱃지만 효율적으로 체크 후 부여
   */
  async checkAndAwardBadges(userId: string) {
    const existing = await this.prisma.userBadge.findMany({
      where: { userId },
      select: { badge: true },
    });
    const earned = new Set(existing.map((b) => b.badge));

    // NEWBIE는 가입 시 즉시 부여하므로 체크 불필요
    if (!earned.has(BadgeType.COMMUNICATOR))
      await this.checkCommunicator(userId);
    if (!earned.has(BadgeType.BEST_ANSWERER))
      await this.checkBestAnswerer(userId);
    if (!earned.has(BadgeType.CURIOUS)) await this.checkCurious(userId);
    if (!earned.has(BadgeType.TASK_HUNTER))
      await this.checkTaskHunter(userId);
    if (!earned.has(BadgeType.CAPTAIN)) await this.checkCaptain(userId);
    if (!earned.has(BadgeType.TEAM_PLAYER))
      await this.checkTeamPlayer(userId);
    // ATTENDANCE_30은 auth.updateStreak()에서 직접 체크
    // PRO/PREMIUM_SUBSCRIBER는 plan 변경 시 직접 처리
  }

  /** 소통장인: 게시글 ≥10 AND 받은 좋아요 ≥100 AND 댓글 ≥50 */
  private async checkCommunicator(userId: string) {
    const [postCount, likeCount, commentCount] = await Promise.all([
      this.prisma.post.count({ where: { authorId: userId } }),
      this.prisma.postLike.count({
        where: { post: { authorId: userId } },
      }),
      this.prisma.postComment.count({ where: { authorId: userId } }),
    ]);
    if (postCount >= 10 && likeCount >= 100 && commentCount >= 50) {
      await this.awardBadge(userId, BadgeType.COMMUNICATOR);
    }
  }

  /** 명답자: 아고라 답변 채택 ≥10 */
  private async checkBestAnswerer(userId: string) {
    const count = await this.prisma.agoraAnswer.count({
      where: { authorId: userId, isAccepted: true },
    });
    if (count >= 10) {
      await this.awardBadge(userId, BadgeType.BEST_ANSWERER);
    }
  }

  /** 호기심천국: 아고라 질문 ≥10 */
  private async checkCurious(userId: string) {
    const count = await this.prisma.agora.count({
      where: { authorId: userId },
    });
    if (count >= 10) {
      await this.awardBadge(userId, BadgeType.CURIOUS);
    }
  }

  /** 태스크 헌터: 태스크 DONE ≥100 */
  private async checkTaskHunter(userId: string) {
    const count = await this.prisma.task.count({
      where: { assigneeId: userId, status: 'DONE' },
    });
    if (count >= 100) {
      await this.awardBadge(userId, BadgeType.TASK_HUNTER);
    }
  }

  /** 캡틴: ADMIN 프로젝트 ≥3개 AND 각 프로젝트 멤버 ≥3명 */
  private async checkCaptain(userId: string) {
    const adminProjects = await this.prisma.projectMember.findMany({
      where: { userId, role: 'ADMIN' },
      select: { projectId: true },
    });

    let qualifiedCount = 0;
    for (const pm of adminProjects) {
      const memberCount = await this.prisma.projectMember.count({
        where: { projectId: pm.projectId },
      });
      if (memberCount >= 3) qualifiedCount++;
    }

    if (qualifiedCount >= 3) {
      await this.awardBadge(userId, BadgeType.CAPTAIN);
    }
  }

  /** 팀플레이어: 프로젝트 참여 ≥5개 */
  private async checkTeamPlayer(userId: string) {
    const count = await this.prisma.projectMember.count({
      where: { userId },
    });
    if (count >= 5) {
      await this.awardBadge(userId, BadgeType.TEAM_PLAYER);
    }
  }

  /**
   * 구독 뱃지 처리 (plan 변경 시 호출)
   */
  async handlePlanChange(userId: string, newPlan: string) {
    if (newPlan === 'PRO') {
      await this.awardBadge(userId, BadgeType.PRO_SUBSCRIBER);
      await this.revokeBadge(userId, BadgeType.PREMIUM_SUBSCRIBER);
    } else if (newPlan === 'PREMIUM') {
      await this.awardBadge(userId, BadgeType.PREMIUM_SUBSCRIBER);
      await this.revokeBadge(userId, BadgeType.PRO_SUBSCRIBER);
    } else {
      // FREE로 다운그레이드
      await this.revokeBadge(userId, BadgeType.PRO_SUBSCRIBER);
      await this.revokeBadge(userId, BadgeType.PREMIUM_SUBSCRIBER);
    }
  }

  /**
   * 내 뱃지 목록 조회
   */
  async findMyBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });
  }
}
