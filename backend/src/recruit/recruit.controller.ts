import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RecruitService } from './recruit.service';
import { CreateRecruitDto, ApplyRecruitDto, UpdateApplicationStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Recruit')
@Controller('recruit')
export class RecruitController {
  constructor(private readonly recruitService: RecruitService) {}

  @Get()
  @ApiOperation({ summary: '팀원모집 목록' })
  @ApiQuery({ name: 'type', required: false, enum: ['PROJECT', 'STUDY'] })
  @ApiQuery({ name: 'position', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'closed'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  findAll(
    @Query('type') type?: string,
    @Query('position') position?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.recruitService.findAll({ type, position, status, page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined });
  }

  @Get(':id')
  @ApiOperation({ summary: '모집글 상세' })
  findOne(@Param('id') id: string) {
    return this.recruitService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '모집글 작성 (워크스페이스 관리자만)' })
  create(@CurrentUser() user: any, @Body() dto: CreateRecruitDto) {
    return this.recruitService.create(user.id, dto);
  }

  @Patch(':id/close')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '모집 마감' })
  close(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recruitService.close(id, user.id);
  }

  @Post(':id/apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '지원하기' })
  apply(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: ApplyRecruitDto) {
    return this.recruitService.apply(id, user.id, dto);
  }

  @Get(':id/applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '지원자 목록 (작성자만)' })
  getApplications(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recruitService.getApplications(id, user.id);
  }

  @Patch(':id/applications/:appId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '지원 수락/거절 (수락 시 워크스페이스 멤버 자동 초대)' })
  updateApplicationStatus(
    @Param('id') id: string,
    @Param('appId') appId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.recruitService.updateApplicationStatus(id, appId, user.id, dto);
  }
}
