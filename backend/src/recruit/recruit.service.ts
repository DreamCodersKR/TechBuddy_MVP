import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecruitDto } from './dto/create-recruit.dto';
import { ApplyRecruitDto } from './dto/apply-recruit.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { ApplicationStatus, ProjectRole } from '@prisma/client';

@Injectable()
export class RecruitService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { type?: string; page?: number; limit?: number }) {
    const { type, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = {
      ...(type && { type: type as any }),
    };

    const [items, total] = await Promise.all([
      this.prisma.recruit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
          _count: { select: { applications: true } },
        },
      }),
      this.prisma.recruit.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const recruit = await this.prisma.recruit.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
        project: { select: { id: true, name: true, type: true } },
        _count: { select: { applications: true } },
      },
    });
    if (!recruit) throw new NotFoundException('모집글을 찾을 수 없습니다');
    return recruit;
  }

  async create(userId: string, dto: CreateRecruitDto) {
    // 해당 워크스페이스의 ADMIN인지 확인
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: dto.projectId, userId } },
    });
    if (!member || member.role !== ProjectRole.ADMIN)
      throw new ForbiddenException('워크스페이스 관리자만 모집글을 작성할 수 있습니다');

    const { deadline, ...rest } = dto;
    return this.prisma.recruit.create({
      data: {
        ...rest,
        authorId: userId,
        deadline: deadline ? new Date(deadline) : null,
      },
    });
  }

  async close(id: string, userId: string) {
    const recruit = await this.prisma.recruit.findUnique({ where: { id } });
    if (!recruit) throw new NotFoundException('모집글을 찾을 수 없습니다');
    if (recruit.authorId !== userId) throw new ForbiddenException('권한이 없습니다');
    if (recruit.isClosed) throw new ConflictException('이미 마감된 모집글입니다');

    return this.prisma.recruit.update({ where: { id }, data: { isClosed: true } });
  }

  async apply(recruitId: string, userId: string, dto: ApplyRecruitDto) {
    const recruit = await this.prisma.recruit.findUnique({ where: { id: recruitId } });
    if (!recruit) throw new NotFoundException('모집글을 찾을 수 없습니다');
    if (recruit.isClosed) throw new ForbiddenException('마감된 모집글에는 지원할 수 없습니다');
    if (recruit.authorId === userId) throw new ForbiddenException('본인 모집글에는 지원할 수 없습니다');

    const existing = await this.prisma.recruitApplication.findUnique({
      where: { recruitId_applicantId: { recruitId, applicantId: userId } },
    });
    if (existing) throw new ConflictException('이미 지원한 모집글입니다');

    return this.prisma.recruitApplication.create({
      data: { recruitId, applicantId: userId, message: dto.message },
    });
  }

  async getApplications(recruitId: string, userId: string) {
    const recruit = await this.prisma.recruit.findUnique({ where: { id: recruitId } });
    if (!recruit) throw new NotFoundException('모집글을 찾을 수 없습니다');
    if (recruit.authorId !== userId) throw new ForbiddenException('작성자만 지원자 목록을 볼 수 있습니다');

    return this.prisma.recruitApplication.findMany({
      where: { recruitId },
      include: {
        applicant: { select: { id: true, name: true, nickname: true, avatarUrl: true, techStack: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateApplicationStatus(
    recruitId: string,
    appId: string,
    userId: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const recruit = await this.prisma.recruit.findUnique({ where: { id: recruitId } });
    if (!recruit) throw new NotFoundException('모집글을 찾을 수 없습니다');
    if (recruit.authorId !== userId) throw new ForbiddenException('권한이 없습니다');

    const app = await this.prisma.recruitApplication.findUnique({ where: { id: appId } });
    if (!app || app.recruitId !== recruitId)
      throw new NotFoundException('지원 내역을 찾을 수 없습니다');

    const updated = await this.prisma.recruitApplication.update({
      where: { id: appId },
      data: { status: dto.status },
    });

    // 수락 시 워크스페이스 멤버 자동 초대
    if (dto.status === ApplicationStatus.ACCEPTED) {
      const existing = await this.prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId: recruit.projectId, userId: app.applicantId } },
      });
      if (!existing) {
        await this.prisma.projectMember.create({
          data: { projectId: recruit.projectId, userId: app.applicantId, role: ProjectRole.MEMBER },
        });
      }
    }

    return updated;
  }
}
