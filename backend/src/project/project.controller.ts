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
import { CreateProjectDto, UpdateProjectDto, UpdateOverviewDto } from './dto';
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
}
