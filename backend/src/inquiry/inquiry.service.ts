import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InquiryStatus } from '@prisma/client';
import { CreateInquiryDto, ReplyInquiryDto } from './dto';

@Injectable()
export class InquiryService {
  constructor(private readonly prisma: PrismaService) {}

  // ── 유저: 문의 작성 ────────────────────────────────────────────
  async create(userId: string, dto: CreateInquiryDto) {
    return this.prisma.inquiry.create({
      data: { userId, ...dto },
      select: { id: true, type: true, title: true, status: true, createdAt: true },
    });
  }

  // ── 유저: 내 문의 목록 ─────────────────────────────────────────
  async findMyInquiries(userId: string) {
    return this.prisma.inquiry.findMany({
      where: { userId },
      select: {
        id: true, type: true, title: true, status: true,
        reply: true, repliedAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 유저: 내 문의 상세 ─────────────────────────────────────────
  async findMyInquiryById(id: string, userId: string) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');
    if (inquiry.userId !== userId) throw new ForbiddenException();
    return inquiry;
  }

  // ── 어드민: 전체 문의 목록 ─────────────────────────────────────
  async findAll(status?: InquiryStatus) {
    return this.prisma.inquiry.findMany({
      where: status ? { status } : {},
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── 어드민: 문의 답변 ──────────────────────────────────────────
  async reply(id: string, dto: ReplyInquiryDto) {
    const inquiry = await this.prisma.inquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException('문의를 찾을 수 없습니다.');

    return this.prisma.inquiry.update({
      where: { id },
      data: {
        reply: dto.reply,
        status: dto.status ?? InquiryStatus.RESOLVED,
        repliedAt: new Date(),
      },
    });
  }
}
