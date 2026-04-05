import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BadgeService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyBadges(userId: string) {
    return this.prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
    });
  }
}
