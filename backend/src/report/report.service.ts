import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';
import { CreateReportDto, ReviewReportDto } from './dto';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 유저: 신고 제출 ────────────────────────────────────────────
  async create(reporterId: string, dto: CreateReportDto) {
    // 자기 자신 신고 방지 (USER 타입일 경우)
    if (dto.targetType === 'USER' && dto.targetId === reporterId) {
      throw new BadRequestException('자기 자신을 신고할 수 없습니다.');
    }

    // 중복 신고 방지
    const existing = await this.prisma.report.findFirst({
      where: { reporterId, targetType: dto.targetType, targetId: dto.targetId },
    });
    if (existing) throw new BadRequestException('이미 신고한 콘텐츠입니다.');

    return this.prisma.report.create({
      data: { reporterId, ...dto },
      select: { id: true, targetType: true, reason: true, status: true, createdAt: true },
    });
  }

  // ── 어드민: 신고 목록 ──────────────────────────────────────────
  async findAll(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: status ? { status } : {},
      include: {
        reporter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 어드민: 신고 처리 ──────────────────────────────────────────
  async review(id: string, dto: ReviewReportDto) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다.');

    // ACTION_TAKEN: 해당 콘텐츠 숨김 처리
    if (dto.status === ReportStatus.ACTION_TAKEN) {
      await this.hideContent(report.targetType, report.targetId);
    }

    return this.prisma.report.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  private async hideContent(targetType: string, targetId: string) {
    if (targetType === 'POST') {
      await this.prisma.post.updateMany({
        where: { id: targetId },
        data: { isHidden: true },
      });
    } else if (targetType === 'COMMENT') {
      await this.prisma.postComment.updateMany({
        where: { id: targetId },
        data: { isHidden: true },
      });
    }
  }
}
