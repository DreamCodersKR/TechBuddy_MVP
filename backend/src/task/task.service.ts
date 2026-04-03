import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { ProjectRole, TaskStatus } from '@prisma/client';

const TASK_INCLUDE = {
  assignee: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
  createdBy: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
  sprint: { select: { id: true, name: true } },
};

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  private async checkMember(workspaceId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('워크스페이스 멤버가 아닙니다');
    return member;
  }

  async create(workspaceId: string, userId: string, dto: CreateTaskDto) {
    await this.checkMember(workspaceId, userId);

    const workspace = await this.prisma.project.findUnique({ where: { id: workspaceId } });
    if (!workspace || workspace.deletedAt)
      throw new NotFoundException('워크스페이스를 찾을 수 없습니다');

    const { dueDate, ...rest } = dto;
    return this.prisma.task.create({
      data: {
        ...rest,
        projectId: workspaceId,
        createdById: userId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: TASK_INCLUDE,
    });
  }

  async findAll(
    workspaceId: string,
    userId: string,
    params: { status?: string; sprintId?: string; assigneeId?: string },
  ) {
    await this.checkMember(workspaceId, userId);

    const { status, sprintId, assigneeId } = params;
    return this.prisma.task.findMany({
      where: {
        projectId: workspaceId,
        ...(status && { status: status as TaskStatus }),
        ...(sprintId === 'none' ? { sprintId: null } : sprintId ? { sprintId } : {}),
        ...(assigneeId && { assigneeId }),
      },
      include: TASK_INCLUDE,
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(workspaceId: string, taskId: string, userId: string) {
    await this.checkMember(workspaceId, userId);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: TASK_INCLUDE,
    });
    if (!task || task.projectId !== workspaceId)
      throw new NotFoundException('태스크를 찾을 수 없습니다');
    return task;
  }

  async update(workspaceId: string, taskId: string, userId: string, dto: UpdateTaskDto) {
    const member = await this.checkMember(workspaceId, userId);

    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== workspaceId)
      throw new NotFoundException('태스크를 찾을 수 없습니다');

    // 멤버는 본인이 생성/담당한 태스크만 수정 가능, 관리자는 전체
    if (member.role !== ProjectRole.ADMIN && task.createdById !== userId && task.assigneeId !== userId)
      throw new ForbiddenException('수정 권한이 없습니다');

    const { dueDate, ...rest } = dto;
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...rest,
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: TASK_INCLUDE,
    });
  }

  async remove(workspaceId: string, taskId: string, userId: string) {
    const member = await this.checkMember(workspaceId, userId);

    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== workspaceId)
      throw new NotFoundException('태스크를 찾을 수 없습니다');

    if (member.role !== ProjectRole.ADMIN && task.createdById !== userId)
      throw new ForbiddenException('삭제 권한이 없습니다');

    await this.prisma.task.delete({ where: { id: taskId } });
    return { message: '태스크가 삭제됐습니다' };
  }
}
