import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateOverviewDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './dto';
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

  // ============================================
  // 멤버 관리 API (DRE-63)
  // ============================================

  /**
   * 멤버 초대
   * - PM 또는 TEAM_LEADER만 초대 가능
   */
  async inviteMember(
    projectId: string,
    userId: string,
    inviteMemberDto: InviteMemberDto,
  ) {
    // 권한 체크 (PM 또는 TEAM_LEADER)
    await this.checkLeaderRole(projectId, userId);

    // 프로젝트 존재 확인
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다');
    }

    // 초대할 사용자 존재 확인
    const targetUser = await this.prisma.user.findUnique({
      where: { id: inviteMemberDto.userId },
    });

    if (!targetUser) {
      throw new NotFoundException('초대할 사용자를 찾을 수 없습니다');
    }

    // 이미 멤버인지 확인
    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: inviteMemberDto.userId },
      },
    });

    if (existingMember) {
      throw new ConflictException('이미 프로젝트 멤버입니다');
    }

    // 멤버 추가
    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId: inviteMemberDto.userId,
        role: inviteMemberDto.role || ProjectRole.MEMBER,
      },
      include: {
        user: {
          select: { id: true, name: true, nickname: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * 멤버 목록 조회
   * - 프로젝트 멤버만 조회 가능
   */
  async getMembers(projectId: string, userId: string) {
    // 프로젝트 존재 확인
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.deletedAt) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다');
    }

    // 멤버인지 확인
    const isMember = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!isMember && !project.isPublic) {
      throw new ForbiddenException('프로젝트에 접근할 권한이 없습니다');
    }

    // 멤버 목록 조회
    const members = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, nickname: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    // 역할별 정렬 (PM → TEAM_LEADER → MEMBER → MENTOR)
    const roleOrder = {
      [ProjectRole.PM]: 0,
      [ProjectRole.TEAM_LEADER]: 1,
      [ProjectRole.MEMBER]: 2,
      [ProjectRole.MENTOR]: 3,
    };

    return members.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
  }

  /**
   * 멤버 역할 변경
   * - PM만 변경 가능
   * - PM 역할은 변경 불가
   */
  async updateMemberRole(
    projectId: string,
    memberId: string,
    userId: string,
    updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    // PM 권한 체크
    await this.checkPMRole(projectId, userId);

    // 대상 멤버 확인
    const targetMember = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
      },
    });

    if (!targetMember || targetMember.projectId !== projectId) {
      throw new NotFoundException('프로젝트 멤버를 찾을 수 없습니다');
    }

    // PM 역할 변경 방지
    if (targetMember.role === ProjectRole.PM) {
      throw new ForbiddenException('PM의 역할은 변경할 수 없습니다');
    }

    // PM으로 변경하려는 경우 방지
    if (updateMemberRoleDto.role === ProjectRole.PM) {
      throw new ForbiddenException('PM 역할로 변경할 수 없습니다. PM 위임 기능을 사용하세요.');
    }

    // 역할 변경
    return this.prisma.projectMember.update({
      where: { id: memberId },
      data: { role: updateMemberRoleDto.role },
      include: {
        user: {
          select: { id: true, name: true, nickname: true, avatarUrl: true },
        },
      },
    });
  }

  /**
   * 멤버 삭제 (내보내기 / 나가기)
   * - PM 또는 TEAM_LEADER만 다른 멤버 삭제 가능
   * - PM은 삭제 불가
   * - 본인은 나가기 가능 (PM 제외)
   */
  async removeMember(projectId: string, memberId: string, userId: string) {
    // 대상 멤버 확인
    const targetMember = await this.prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.projectId !== projectId) {
      throw new NotFoundException('프로젝트 멤버를 찾을 수 없습니다');
    }

    // 본인 탈퇴인 경우
    if (targetMember.userId === userId) {
      // PM은 나갈 수 없음
      if (targetMember.role === ProjectRole.PM) {
        throw new ForbiddenException('PM은 프로젝트를 나갈 수 없습니다. 먼저 PM을 위임하세요.');
      }

      await this.prisma.projectMember.delete({
        where: { id: memberId },
      });

      return { message: '프로젝트에서 나갔습니다' };
    }

    // 다른 멤버 내보내기인 경우 - 권한 체크
    await this.checkLeaderRole(projectId, userId);

    // PM 삭제 방지
    if (targetMember.role === ProjectRole.PM) {
      throw new ForbiddenException('PM은 내보낼 수 없습니다');
    }

    await this.prisma.projectMember.delete({
      where: { id: memberId },
    });

    return { message: '멤버를 내보냈습니다' };
  }
}
