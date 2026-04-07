import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeType } from '@prisma/client';

@Injectable()
export class XpService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 레벨 계산
   * Lv.1: 0~99 / Lv.2: 100~299 / Lv.3: 300~699 / Lv.4: 700~1499 / Lv.5: 1500~
   * 각 레벨 필요 XP: 100, 200, 400, 800, ... (2배씩)
   */
  private calcLevel(xp: number): number {
    let level = 1;
    let threshold = 100;
    while (xp >= threshold) {
      level++;
      threshold += 100 * Math.pow(2, level - 1);
    }
    return level;
  }

  /**
   * XP 부여 + 레벨업 체크 + ACTIVITY 뱃지 자동 지급
   */
  async grantXP(userId: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });
    if (!user) return;

    const newXp = user.xp + amount;
    const newLevel = this.calcLevel(newXp);

    await this.prisma.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel },
    });

    // 레벨업 시 Lv.5 이상이면 ACTIVITY 뱃지 지급
    if (newLevel > user.level && newLevel >= 5) {
      await this.awardBadge(userId, BadgeType.ACTIVITY);
    }

    return { newXp, newLevel, leveledUp: newLevel > user.level };
  }

  /**
   * 뱃지 지급 (중복 무시: @@unique([userId, badge]))
   */
  async awardBadge(userId: string, badge: BadgeType) {
    try {
      await this.prisma.userBadge.create({ data: { userId, badge } });
    } catch {
      // 이미 획득한 뱃지 → 무시
    }
  }
}
