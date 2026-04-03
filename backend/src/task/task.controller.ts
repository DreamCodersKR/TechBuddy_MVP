import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Tasks')
@Controller('workspaces/:workspaceId/tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: '태스크 생성' })
  @ApiResponse({ status: 201, description: '태스크 생성 성공' })
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskService.create(workspaceId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '태스크 목록 조회' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'sprintId', required: false, description: '"none"으로 보내면 스프린트 미배정 태스크만 조회' })
  @ApiQuery({ name: 'assigneeId', required: false })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('sprintId') sprintId?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.taskService.findAll(workspaceId, user.id, { status, sprintId, assigneeId });
  }

  @Get(':taskId')
  @ApiOperation({ summary: '태스크 상세 조회' })
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
  ) {
    return this.taskService.findOne(workspaceId, taskId, user.id);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: '태스크 수정' })
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.update(workspaceId, taskId, user.id, dto);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: '태스크 삭제 (관리자 또는 생성자)' })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: any,
  ) {
    return this.taskService.remove(workspaceId, taskId, user.id);
  }
}
