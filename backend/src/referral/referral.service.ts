import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ReferralService {
  constructor(private readonly prisma: PrismaService) {}

  // 초대 보상 크레딧
  private readonly REFERRER_REWARD = 50;  // 초대한 사람
  private readonly INVITEE_REWARD  = 30;  // 초대받아 가입한 사람

  /**
   * 내 초대 코드 조회 (없으면 자동 생성)
   */
  async getMyCode(userId: string) {
    let code = await this.prisma.referralCode.findUnique({ where: { userId } });

    if (!code) {
      const generated = randomBytes(4).toString('hex').toUpperCase(); // 예: A3F8C1D2
      code = await this.prisma.referralCode.create({
        data: { userId, code: generated },
      });
    }

    const usages = await this.prisma.referralUsage.count({
      where: { referralCodeId: code.id },
    });

    return {
      code: code.code,
      usedCount: usages,
      referrerReward: this.REFERRER_REWARD,
      inviteeReward: this.INVITEE_REWARD,
    };
  }

  /**
   * 회원가입 시 초대 코드 처리 (auth.service에서 호출)
   * @param newUserId 새로 가입한 사용자 ID
   * @param referralCode 입력한 초대 코드
   */
  async applyReferral(newUserId: string, referralCode: string): Promise<void> {
    const code = await this.prisma.referralCode.findUnique({
      where: { code: referralCode },
    });
    if (!code) return; // 잘못된 코드면 조용히 무시

    // 자기 자신 초대 불가
    if (code.userId === newUserId) return;

    // 이미 초대 코드 사용한 이력 있는지 확인
    const alreadyUsed = await this.prisma.referralUsage.findUnique({
      where: { newUserId },
    });
    if (alreadyUsed) return;

    // 트랜잭션: 초대 기록 + 양쪽 크레딧 지급
    await this.prisma.$transaction([
      // 초대 사용 기록
      this.prisma.referralUsage.create({
        data: { referralCodeId: code.id, newUserId },
      }),
      // 사용 수 증가
      this.prisma.referralCode.update({
        where: { id: code.id },
        data: { usedCount: { increment: 1 } },
      }),
      // 초대한 사람 크레딧 +50
      this.prisma.creditTransaction.create({
        data: {
          userId: code.userId,
          amount: this.REFERRER_REWARD,
          type: 'EARN',
          description: '친구 초대 보상',
          relatedId: newUserId,
        },
      }),
      this.prisma.user.update({
        where: { id: code.userId },
        data: { credit: { increment: this.REFERRER_REWARD } },
      }),
      // 초대받아 가입한 사람 크레딧 +30
      this.prisma.creditTransaction.create({
        data: {
          userId: newUserId,
          amount: this.INVITEE_REWARD,
          type: 'EARN',
          description: '초대 코드 사용 보너스',
          relatedId: code.userId,
        },
      }),
      this.prisma.user.update({
        where: { id: newUserId },
        data: { credit: { increment: this.INVITEE_REWARD } },
      }),
    ]);
  }

  /**
   * 초대 현황 조회
   */
  async getStats(userId: string) {
    const code = await this.prisma.referralCode.findUnique({
      where: { userId },
      include: {
        usages: {
          include: {
            newUser: { select: { id: true, name: true, nickname: true, avatarUrl: true, createdAt: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!code) return { code: null, totalInvited: 0, totalEarned: 0, recentInvitees: [] };

    return {
      code: code.code,
      totalInvited: code.usedCount,
      totalEarned: code.usedCount * this.REFERRER_REWARD,
      recentInvitees: code.usages.map((u) => u.newUser),
    };
  }
}
