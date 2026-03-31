import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { ProjectRole } from '@prisma/client';

@Injectable()
export class SprintService {
  constructor(private prisma: PrismaService) {}

  private async checkAdminRole(workspaceId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('워크스페이스 멤버가 아닙니다');
    if (member.role !== ProjectRole.ADMIN)
      throw new ForbiddenException('관리자만 이 작업을 수행할 수 있습니다');
  }

  private async checkMember(workspaceId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('워크스페이스 멤버가 아닙니다');
  }

  async create(workspaceId: string, userId: string, dto: CreateSprintDto) {
    await this.checkAdminRole(workspaceId, userId);

    const workspace = await this.prisma.project.findUnique({ where: { id: workspaceId } });
    if (!workspace || workspace.deletedAt)
      throw new NotFoundException('워크스페이스를 찾을 수 없습니다');

    const { startDate, endDate, ...rest } = dto;
    return this.prisma.sprint.create({
      data: {
        ...rest,
        projectId: workspaceId,
        createdById: userId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
  }

  async findAll(workspaceId: string, userId: string) {
    await this.checkMember(workspaceId, userId);
    return this.prisma.sprint.findMany({
      where: { projectId: workspaceId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(workspaceId: string, sprintId: string, userId: string) {
    await this.checkMember(workspaceId, userId);
    const sprint = await this.prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!sprint || sprint.projectId !== workspaceId)
      throw new NotFoundException('스프린트를 찾을 수 없습니다');
    return sprint;
  }

  async update(workspaceId: string, sprintId: string, userId: string, dto: UpdateSprintDto) {
    await this.checkAdminRole(workspaceId, userId);

    const sprint = await this.prisma.sprint.findUnique({ where: { id: sprintId } });
    if (!sprint || sprint.projectId !== workspaceId)
      throw new NotFoundException('스프린트를 찾을 수 없습니다');

    const { startDate, endDate, ...rest } = dto;
    return this.prisma.sprint.update({
      where: { id: sprintId },
      data: {
        ...rest,
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    });
  }

  async remove(workspaceId: string, sprintId: string, userId: string) {
    await this.checkAdminRole(workspaceId, userId);

    const sprint = await this.prisma.sprint.findUnique({ where: { id: sprintId } });
    if (!sprint || sprint.projectId !== workspaceId)
      throw new NotFoundException('스프린트를 찾을 수 없습니다');

    await this.prisma.sprint.delete({ where: { id: sprintId } });
    return { message: '스프린트가 삭제되었습니다' };
  }
}
