import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectService } from './project.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  UpdateOverviewDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Projects')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  /**
   * 프로젝트 생성
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 생성' })
  @ApiResponse({ status: 201, description: '프로젝트 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  create(@CurrentUser() user: any, @Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(user.id, createProjectDto);
  }

  /**
   * 프로젝트 목록 조회
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 목록 조회 (본인이 멤버인 프로젝트만)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'organizationId', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
  })
  @ApiResponse({ status: 200, description: '프로젝트 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  findAll(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('organizationId') organizationId?: string,
    @Query('status') status?: string,
  ) {
    return this.projectService.findAll(user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      organizationId,
      status,
    });
  }

  /**
   * 프로젝트 상세 조회
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 상세 조회' })
  @ApiResponse({ status: 200, description: '프로젝트 상세 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '접근 권한 없음' })
  @ApiResponse({ status: 404, description: '프로젝트를 찾을 수 없음' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectService.findOne(id, user.id);
  }

  /**
   * 프로젝트 수정
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 수정 (PM만 가능)' })
  @ApiResponse({ status: 200, description: '프로젝트 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: 'PM 권한 필요' })
  @ApiResponse({ status: 404, description: '프로젝트를 찾을 수 없음' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(id, user.id, updateProjectDto);
  }

  /**
   * 프로젝트 삭제 (Soft Delete)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 삭제 (PM만 가능, Soft Delete)' })
  @ApiResponse({ status: 200, description: '프로젝트 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: 'PM 권한 필요' })
  @ApiResponse({ status: 404, description: '프로젝트를 찾을 수 없음' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectService.remove(id, user.id);
  }

  /**
   * Overview 저장
   */
  @Patch(':id/overview')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Overview 저장 (PM/팀리더만 가능)' })
  @ApiResponse({ status: 200, description: 'Overview 저장 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: 'PM 또는 팀리더 권한 필요' })
  @ApiResponse({ status: 404, description: '프로젝트를 찾을 수 없음' })
  updateOverview(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateOverviewDto: UpdateOverviewDto,
  ) {
    return this.projectService.updateOverview(id, user.id, updateOverviewDto);
  }

  // ============================================
  // 멤버 관리 API (DRE-63)
  // ============================================

  /**
   * 멤버 초대
   */
  @Post(':projectId/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 멤버 초대 (PM/팀리더만 가능)' })
  @ApiResponse({ status: 201, description: '멤버 초대 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: 'PM 또는 팀리더 권한 필요' })
  @ApiResponse({ status: 404, description: '프로젝트 또는 사용자를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 프로젝트 멤버입니다' })
  inviteMember(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.projectService.inviteMember(projectId, user.id, inviteMemberDto);
  }

  /**
   * 멤버 목록 조회
   */
  @Get(':projectId/members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 멤버 목록 조회' })
  @ApiResponse({ status: 200, description: '멤버 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '접근 권한 없음' })
  @ApiResponse({ status: 404, description: '프로젝트를 찾을 수 없음' })
  getMembers(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.projectService.getMembers(projectId, user.id);
  }

  /**
   * 멤버 역할 변경
   */
  @Patch(':projectId/members/:memberId/role')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '멤버 역할 변경 (PM만 가능)' })
  @ApiResponse({ status: 200, description: '역할 변경 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: 'PM 권한 필요 / PM 역할 변경 불가' })
  @ApiResponse({ status: 404, description: '프로젝트 멤버를 찾을 수 없음' })
  updateMemberRole(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.projectService.updateMemberRole(
      projectId,
      memberId,
      user.id,
      updateMemberRoleDto,
    );
  }

  /**
   * 멤버 삭제 / 나가기
   */
  @Delete(':projectId/members/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '멤버 내보내기 / 프로젝트 나가기' })
  @ApiResponse({ status: 200, description: '멤버 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '권한 없음 / PM은 삭제 불가' })
  @ApiResponse({ status: 404, description: '프로젝트 멤버를 찾을 수 없음' })
  removeMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.projectService.removeMember(projectId, memberId, user.id);
  }
}
