import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { UserPlan, CreditTransactionType } from '@prisma/client';

export const PLAN_MONTHLY_CREDITS: Record<UserPlan, number> = {
  [UserPlan.FREE]: 100,
  [UserPlan.PRO]: 3000,
  [UserPlan.PREMIUM]: 5000,
};

@Injectable()
export class CreditSchedulerService {
  private readonly logger = new Logger(CreditSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 매월 1일 00:00 UTC (한국 기준 09:00 KST) 크레딧 리셋
   * - 모든 플랜: 잔여 크레딧 소멸 후 플랜 기준 크레딧으로 리셋
   */
  @Cron('0 0 1 * *')
  async resetMonthlyCredits() {
    this.logger.log('월별 크레딧 리셋 시작');

    const users = await this.prisma.user.findMany({
      where: { isBanned: false },
      select: { id: true, plan: true, credit: true },
    });

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      const newCredit = PLAN_MONTHLY_CREDITS[user.plan];
      try {
        await this.prisma.$transaction([
          this.prisma.user.update({
            where: { id: user.id },
            data: {
              credit: newCredit,
              creditResetAt: new Date(),
            },
          }),
          this.prisma.creditTransaction.create({
            data: {
              userId: user.id,
              amount: newCredit,
              type: CreditTransactionType.EARN,
              description: `월별 크레딧 리셋 (${user.plan} 플랜 → ${newCredit}cr)`,
            },
          }),
        ]);
        successCount++;
      } catch (err) {
        this.logger.error(`유저 ${user.id} 크레딧 리셋 실패`, err);
        errorCount++;
      }
    }

    this.logger.log(
      `월별 크레딧 리셋 완료 — 성공: ${successCount}명, 실패: ${errorCount}명`,
    );
  }

  /**
   * 회원가입 시 초기 크레딧 지급
   */
  async grantInitialCredits(userId: string, plan: UserPlan = UserPlan.FREE) {
    const amount = PLAN_MONTHLY_CREDITS[plan];
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { credit: amount, creditResetAt: new Date() },
      }),
      this.prisma.creditTransaction.create({
        data: {
          userId,
          amount,
          type: CreditTransactionType.EARN,
          description: `회원가입 초기 크레딧 지급 (${plan} 플랜 → ${amount}cr)`,
        },
      }),
    ]);
  }
}
