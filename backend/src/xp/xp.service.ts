import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
   * XP 부여 + 레벨업 체크
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

    return { newXp, newLevel, leveledUp: newLevel > user.level };
  }
}
