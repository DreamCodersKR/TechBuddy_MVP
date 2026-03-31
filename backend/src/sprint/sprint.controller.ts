import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SprintService } from './sprint.service';
import { CreateSprintDto, UpdateSprintDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Sprints')
@Controller('workspaces/:workspaceId/sprints')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  @Post()
  @ApiOperation({ summary: '스프린트 생성 (관리자만)' })
  @ApiResponse({ status: 201, description: '스프린트 생성 성공' })
  create(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateSprintDto,
  ) {
    return this.sprintService.create(workspaceId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '스프린트 목록 조회' })
  findAll(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.sprintService.findAll(workspaceId, user.id);
  }

  @Get(':sprintId')
  @ApiOperation({ summary: '스프린트 상세 조회 (Tasks 포함)' })
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('sprintId') sprintId: string,
    @CurrentUser() user: any,
  ) {
    return this.sprintService.findOne(workspaceId, sprintId, user.id);
  }

  @Patch(':sprintId')
  @ApiOperation({ summary: '스프린트 수정 (관리자만)' })
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('sprintId') sprintId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.sprintService.update(workspaceId, sprintId, user.id, dto);
  }

  @Delete(':sprintId')
  @ApiOperation({ summary: '스프린트 삭제 (관리자만)' })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('sprintId') sprintId: string,
    @CurrentUser() user: any,
  ) {
    return this.sprintService.remove(workspaceId, sprintId, user.id);
  }
}
