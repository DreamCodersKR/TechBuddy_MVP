import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudyService } from './study.service';
import {
  CreateStudyWeekDto,
  UpdateStudyWeekDto,
  CreateStudyAssignmentDto,
  UpdateStudyAssignmentDto,
  CreateSubmissionDto,
  UpsertPenaltyRuleDto,
  CreateStudyResourceDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Study Room')
@Controller('workspaces/:workspaceId/study')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  // ─── 주차 ─────────────────────────────────────────────────────────────────

  @Get('weeks')
  @ApiOperation({ summary: '주차 목록 조회 (과제+제출 포함)' })
  getWeeks(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.studyService.getWeeks(workspaceId, user.id);
  }

  @Post('weeks')
  @ApiOperation({ summary: '주차 생성 (ADMIN)' })
  createWeek(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateStudyWeekDto,
  ) {
    return this.studyService.createWeek(workspaceId, user.id, dto);
  }

  @Patch('weeks/:weekId')
  @ApiOperation({ summary: '주차 수정 (ADMIN)' })
  updateWeek(
    @Param('workspaceId') workspaceId: string,
    @Param('weekId') weekId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateStudyWeekDto,
  ) {
    return this.studyService.updateWeek(workspaceId, weekId, user.id, dto);
  }

  @Delete('weeks/:weekId')
  @HttpCode(204)
  @ApiOperation({ summary: '주차 삭제 (ADMIN)' })
  deleteWeek(
    @Param('workspaceId') workspaceId: string,
    @Param('weekId') weekId: string,
    @CurrentUser() user: any,
  ) {
    return this.studyService.deleteWeek(workspaceId, weekId, user.id);
  }

  // ─── 과제 ─────────────────────────────────────────────────────────────────

  @Post('weeks/:weekId/assignments')
  @ApiOperation({ summary: '과제 생성 (ADMIN)' })
  createAssignment(
    @Param('workspaceId') workspaceId: string,
    @Param('weekId') weekId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateStudyAssignmentDto,
  ) {
    return this.studyService.createAssignment(workspaceId, weekId, user.id, dto);
  }

  @Patch('assignments/:assignmentId')
  @ApiOperation({ summary: '과제 수정 (ADMIN)' })
  updateAssignment(
    @Param('workspaceId') workspaceId: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateStudyAssignmentDto,
  ) {
    return this.studyService.updateAssignment(workspaceId, assignmentId, user.id, dto);
  }

  @Delete('assignments/:assignmentId')
  @HttpCode(204)
  @ApiOperation({ summary: '과제 삭제 (ADMIN)' })
  deleteAssignment(
    @Param('workspaceId') workspaceId: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.studyService.deleteAssignment(workspaceId, assignmentId, user.id);
  }

  // ─── 과제 제출 ────────────────────────────────────────────────────────────

  @Get('assignments/:assignmentId/submissions')
  @ApiOperation({ summary: '과제 제출 현황 (전체 멤버 기준)' })
  getSubmissions(
    @Param('workspaceId') workspaceId: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.studyService.getSubmissions(workspaceId, assignmentId, user.id);
  }

  @Post('assignments/:assignmentId/submissions/mine')
  @ApiOperation({ summary: '내 과제 제출' })
  submitAssignment(
    @Param('workspaceId') workspaceId: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateSubmissionDto,
  ) {
    return this.studyService.submitAssignment(workspaceId, assignmentId, user.id, dto);
  }

  @Delete('assignments/:assignmentId/submissions/mine')
  @HttpCode(204)
  @ApiOperation({ summary: '내 과제 제출 취소' })
  cancelSubmission(
    @Param('workspaceId') workspaceId: string,
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.studyService.cancelSubmission(workspaceId, assignmentId, user.id);
  }

  // ─── 벌금 규칙 ───────────────────────────────────────────────────────────

  @Get('penalty')
  @ApiOperation({ summary: '벌금 규칙 + 동의 현황 + 이력 조회' })
  getPenaltyRule(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.studyService.getPenaltyRule(workspaceId, user.id);
  }

  @Post('penalty')
  @ApiOperation({ summary: '벌금 규칙 생성/수정 (ADMIN) — 수정 시 동의 초기화' })
  upsertPenaltyRule(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Body() dto: UpsertPenaltyRuleDto,
  ) {
    return this.studyService.upsertPenaltyRule(workspaceId, user.id, dto);
  }

  @Post('penalty/consent')
  @ApiOperation({ summary: '벌금 규칙 동의 (전원 동의 시 자동 활성화)' })
  consentPenalty(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.studyService.consentPenalty(workspaceId, user.id);
  }

  @Delete('penalty/consent')
  @HttpCode(204)
  @ApiOperation({ summary: '벌금 동의 철회 (활성화 전만 가능)' })
  revokePenaltyConsent(@Param('workspaceId') workspaceId: string, @CurrentUser() user: any) {
    return this.studyService.revokePenaltyConsent(workspaceId, user.id);
  }

  // ─── 자료 공유 ────────────────────────────────────────────────────────────

  @Get('resources')
  @ApiOperation({ summary: '자료 목록 조회' })
  @ApiQuery({ name: 'category', required: false, enum: ['LINK', 'FILE', 'VIDEO', 'OTHER'] })
  getResources(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Query('category') category?: string,
  ) {
    return this.studyService.getResources(workspaceId, user.id, category);
  }

  @Post('resources')
  @ApiOperation({ summary: '자료 추가' })
  createResource(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateStudyResourceDto,
  ) {
    return this.studyService.createResource(workspaceId, user.id, dto);
  }

  @Delete('resources/:resourceId')
  @HttpCode(204)
  @ApiOperation({ summary: '자료 삭제 (본인 또는 ADMIN)' })
  deleteResource(
    @Param('workspaceId') workspaceId: string,
    @Param('resourceId') resourceId: string,
    @CurrentUser() user: any,
  ) {
    return this.studyService.deleteResource(workspaceId, resourceId, user.id);
  }
}
