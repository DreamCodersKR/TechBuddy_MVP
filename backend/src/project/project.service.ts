import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, UpdateOverviewDto } from './dto';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  /**
   * 프로젝트 생성
   * - 생성자를 PM 역할로 ProjectMember에 자동 추가
   */
  async create(createdById: string, createProjectDto: CreateProjectDto) {
    const { startDate, endDate, ...rest } = createProjectDto;

    return this.prisma.project.create({
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdById,
        // PM 역할로 자동 추가
        members: {
          create: {
            userId: createdById,
            role: ProjectRole.PM,
          },
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, nickname: true, avatarUrl: true },
            },
          },
        },
        organization: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * 프로젝트 목록 조회
   * - 본인이 멤버인 프로젝트만 조회
   * - Soft Delete된 프로젝트 제외
   */
  async findAll(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      organizationId?: string;
      status?: string;
    },
  ) {
    const { page = 1, limit = 20, organizationId, status } = params;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null, // Soft Delete 제외
      members: {
        some: { userId }, // 본인이 멤버인 프로젝트만
      },
      ...(organizationId && { organizationId }),
      ...(status && { status: status as any }),
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, name: true, nickname: true, avatarUrl: true },
          },
          organization: {
            select: { id: true, name: true },
          },
          _count: {
            select: { members: true, tasks: true },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 프로젝트 상세 조회
   * - members, createdBy 포함
   */
  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
        organization: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, nickname: true, avatarUrl: true },
            },
          },
        },
        _count: {
          select: { tasks: true, files: true },
        },
      },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다');
    }

    // 멤버인지 확인
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember && !project.isPublic) {
      throw new ForbiddenException('프로젝트에 접근할 권한이 없습니다');
    }

    return project;
  }

  /**
   * 프로젝트 수정
   * - PM만 수정 가능
   */
  async update(id: string, userId: string, updateProjectDto: UpdateProjectDto) {
    await this.checkPMRole(id, userId);

    const { startDate, endDate, ...rest } = updateProjectDto;

    return this.prisma.project.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
        organization: {
          select: { id: true, name: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, nickname: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  /**
   * 프로젝트 삭제 (Soft Delete)
   * - PM만 삭제 가능
   */
  async remove(id: string, userId: string) {
    await this.checkPMRole(id, userId);

    await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: '프로젝트가 삭제되었습니다' };
  }

  /**
   * Overview 저장
   * - PM 또는 TEAM_LEADER만 수정 가능
   */
  async updateOverview(
    id: string,
    userId: string,
    updateOverviewDto: UpdateOverviewDto,
  ) {
    await this.checkLeaderRole(id, userId);

    return this.prisma.project.update({
      where: { id },
      data: { overview: updateOverviewDto.overview },
      select: {
        id: true,
        name: true,
        overview: true,
        updatedAt: true,
      },
    });
  }

  /**
   * PM 권한 체크
   */
  private async checkPMRole(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('프로젝트 멤버가 아닙니다');
    }

    if (member.role !== ProjectRole.PM) {
      throw new ForbiddenException('PM만 이 작업을 수행할 수 있습니다');
    }
  }

  /**
   * PM 또는 TEAM_LEADER 권한 체크
   */
  private async checkLeaderRole(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('프로젝트 멤버가 아닙니다');
    }

    if (member.role !== ProjectRole.PM && member.role !== ProjectRole.TEAM_LEADER) {
      throw new ForbiddenException('PM 또는 팀 리더만 이 작업을 수행할 수 있습니다');
    }
  }
}
