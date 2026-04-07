import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from '../xp/xp.service';
import { QuestService, QUEST_KEYS } from '../quest/quest.service';
import { CreateTilDto, UpdateTilDto } from './til.dto';

@Injectable()
export class TilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
    private readonly quest: QuestService,
  ) {}

  /**
   * TIL 작성 (하루 1개 제한)
   */
  async create(authorId: string, dto: CreateTilDto) {
    const date = dto.date
      ? new Date(dto.date)
      : new Date(new Date().toDateString());

    // 하루 1개 제한 체크
    const existing = await this.prisma.til.findUnique({
      where: { authorId_date: { authorId, date } },
    });
    if (existing) {
      throw new ConflictException('오늘의 TIL은 이미 작성하셨습니다');
    }

    const til = await this.prisma.til.create({
      data: {
        authorId,
        title: dto.title,
        content: dto.content,
        tags: dto.tags ?? [],
        date,
      },
      include: {
        author: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
      },
    });

    // XP 부여: TIL 작성 +15
    if (!til.xpGranted) {
      await this.xp.grantXP(authorId, 15);
      await this.prisma.til.update({
        where: { id: til.id },
        data: { xpGranted: true },
      });
    }

    // 퀘스트 체크: TIL 작성
    await this.quest.checkAndComplete(authorId, QUEST_KEYS.TIL_WRITE);

    return til;
  }

  /**
   * 피드 (전체 또는 특정 유저 TIL 목록)
   */
  async findAll(authorId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = authorId ? { authorId } : {};

    const [items, total] = await Promise.all([
      this.prisma.til.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          author: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
        },
      }),
      this.prisma.til.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  /**
   * 단건 조회
   */
  async findOne(id: string) {
    const til = await this.prisma.til.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
      },
    });
    if (!til) throw new NotFoundException('TIL을 찾을 수 없습니다');
    return til;
  }

  /**
   * 수정 (본인만)
   */
  async update(id: string, userId: string, dto: UpdateTilDto) {
    const til = await this.prisma.til.findUnique({ where: { id } });
    if (!til) throw new NotFoundException('TIL을 찾을 수 없습니다');
    if (til.authorId !== userId) throw new ForbiddenException('본인의 TIL만 수정할 수 있습니다');

    return this.prisma.til.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.content && { content: dto.content }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
      include: {
        author: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
      },
    });
  }

  /**
   * 삭제 (본인만)
   */
  async remove(id: string, userId: string) {
    const til = await this.prisma.til.findUnique({ where: { id } });
    if (!til) throw new NotFoundException('TIL을 찾을 수 없습니다');
    if (til.authorId !== userId) throw new ForbiddenException('본인의 TIL만 삭제할 수 있습니다');
    await this.prisma.til.delete({ where: { id } });
  }

  /**
   * 잔디 히트맵 데이터: 날짜별 TIL 작성 수 집계
   * 반환: { '2026-04-08': 1, '2026-04-07': 1, ... }
   */
  async getHeatmap(userId: string, year?: number) {
    const targetYear = year ?? new Date().getFullYear();
    const startDate = new Date(`${targetYear}-01-01`);
    const endDate = new Date(`${targetYear}-12-31`);

    const tils = await this.prisma.til.findMany({
      where: {
        authorId: userId,
        date: { gte: startDate, lte: endDate },
      },
      select: { date: true },
    });

    // 날짜별 집계
    const heatmap: Record<string, number> = {};
    for (const til of tils) {
      const key = til.date.toISOString().split('T')[0];
      heatmap[key] = (heatmap[key] ?? 0) + 1;
    }

    return heatmap;
  }
}
