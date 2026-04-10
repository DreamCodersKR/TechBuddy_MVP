import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { KptService } from './kpt.service';
import { UpsertKptDto } from './dto/upsert-kpt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('KPT Retrospective')
@Controller('workspaces/:wid/sprints/:sid/kpt')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KptController {
  constructor(private readonly kptService: KptService) {}

  @Post()
  @ApiOperation({ summary: '내 KPT 회고 작성/수정' })
  @ApiParam({ name: 'wid', description: '워크스페이스(프로젝트) ID' })
  @ApiParam({ name: 'sid', description: '스프린트 ID' })
  @ApiResponse({ status: 201, description: 'KPT 저장 성공' })
  upsert(
    @Param('sid') sprintId: string,
    @CurrentUser() user: any,
    @Body() dto: UpsertKptDto,
  ) {
    return this.kptService.upsert(sprintId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '스프린트 전체 KPT 회고 조회 (팀원 전체 + AI 요약)' })
  @ApiParam({ name: 'wid', description: '워크스페이스(프로젝트) ID' })
  @ApiParam({ name: 'sid', description: '스프린트 ID' })
  @ApiResponse({ status: 200, description: 'KPT 목록 + 요약' })
  findBySprintId(
    @Param('sid') sprintId: string,
    @CurrentUser() user: any,
  ) {
    return this.kptService.findBySprintId(sprintId, user.id);
  }

  @Post('ai-summary')
  @ApiOperation({ summary: 'AI KPT 요약 생성 (Gemini Flash-Lite)' })
  @ApiParam({ name: 'wid', description: '워크스페이스(프로젝트) ID' })
  @ApiParam({ name: 'sid', description: '스프린트 ID' })
  @ApiResponse({ status: 201, description: 'AI 요약 생성 성공' })
  generateSummary(
    @Param('sid') sprintId: string,
    @CurrentUser() user: any,
  ) {
    return this.kptService.generateSummary(sprintId, user.id);
  }
}
