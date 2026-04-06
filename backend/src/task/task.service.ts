import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, CreateCommentDto, UpdateCommentDto } from './dto';
import { ProjectRole, TaskStatus } from '@prisma/client';

const TASK_INCLUDE = {
  assignee: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
  createdBy: { select: { id: true, name: true, nickname: true, avatarUrl: true } },
  sprint: { select: { id: true, name: true } },
  project: { select: { id: true, issuePrefix: true } },
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

  async findMyTasks(userId: string, status?: string) {
    return this.prisma.task.findMany({
      where: {
        assigneeId: userId,
        project: { deletedAt: null },
        ...(status && { status: status as TaskStatus }),
      },
      include: {
        ...TASK_INCLUDE,
        project: { select: { id: true, name: true, type: true } },
      },
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(workspaceId: string, userId: string, dto: CreateTaskDto) {
    await this.checkMember(workspaceId, userId);

    const workspace = await this.prisma.project.findUnique({ where: { id: workspaceId } });
    if (!workspace || workspace.deletedAt)
      throw new NotFoundException('워크스페이스를 찾을 수 없습니다');

    // issueNumber: 프로젝트 내 max + 1
    const maxResult = await this.prisma.task.aggregate({
      where: { projectId: workspaceId },
      _max: { issueNumber: true },
    });
    const issueNumber = (maxResult._max.issueNumber ?? 0) + 1;

    // position: 해당 status 컬럼 내 max + 1
    const posResult = await this.prisma.task.aggregate({
      where: { projectId: workspaceId, status: dto.status ?? 'TODO' },
      _max: { position: true },
    });
    const position = (posResult._max.position ?? 0) + 1;

    const { dueDate, ...rest } = dto;
    return this.prisma.task.create({
      data: {
        ...rest,
        projectId: workspaceId,
        createdById: userId,
        dueDate: dueDate ? new Date(dueDate) : null,
        issueNumber,
        position,
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
      orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
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

  async reorder(workspaceId: string, userId: string, updates: { id: string; position: number; status: string }[]) {
    await this.checkMember(workspaceId, userId);

    await this.prisma.$transaction(
      updates.map(u =>
        this.prisma.task.update({
          where: { id: u.id },
          data: { position: u.position, status: u.status as TaskStatus },
        }),
      ),
    );
    return { message: 'ok' };
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

  // ─── 태스크 코멘트 ──────────────────────────────────────────

  private async checkTask(workspaceId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.projectId !== workspaceId)
      throw new NotFoundException('태스크를 찾을 수 없습니다');
    return task;
  }

  async createComment(workspaceId: string, taskId: string, userId: string, dto: CreateCommentDto) {
    await this.checkMember(workspaceId, userId);
    await this.checkTask(workspaceId, taskId);

    return this.prisma.taskComment.create({
      data: { taskId, authorId: userId, content: dto.content },
      include: { author: { select: { id: true, name: true, nickname: true, avatarUrl: true } } },
    });
  }

  async findComments(workspaceId: string, taskId: string, userId: string) {
    await this.checkMember(workspaceId, userId);
    await this.checkTask(workspaceId, taskId);

    return this.prisma.taskComment.findMany({
      where: { taskId },
      include: { author: { select: { id: true, name: true, nickname: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateComment(workspaceId: string, taskId: string, commentId: string, userId: string, dto: UpdateCommentDto) {
    await this.checkMember(workspaceId, userId);
    await this.checkTask(workspaceId, taskId);

    const comment = await this.prisma.taskComment.findUnique({ where: { id: commentId } });
    if (!comment || comment.taskId !== taskId)
      throw new NotFoundException('코멘트를 찾을 수 없습니다');
    if (comment.authorId !== userId)
      throw new ForbiddenException('본인 코멘트만 수정할 수 있습니다');

    return this.prisma.taskComment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: { author: { select: { id: true, name: true, nickname: true, avatarUrl: true } } },
    });
  }

  async deleteComment(workspaceId: string, taskId: string, commentId: string, userId: string) {
    const member = await this.checkMember(workspaceId, userId);
    await this.checkTask(workspaceId, taskId);

    const comment = await this.prisma.taskComment.findUnique({ where: { id: commentId } });
    if (!comment || comment.taskId !== taskId)
      throw new NotFoundException('코멘트를 찾을 수 없습니다');
    if (member.role !== ProjectRole.ADMIN && comment.authorId !== userId)
      throw new ForbiddenException('본인 코멘트만 삭제할 수 있습니다');

    await this.prisma.taskComment.delete({ where: { id: commentId } });
    return { message: '코멘트가 삭제됐습니다' };
  }
}
