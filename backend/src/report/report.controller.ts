import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole, ReportStatus } from '@prisma/client';
import { ReportService } from './report.service';
import { CreateReportDto, ReviewReportDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators';

@ApiTags('Report')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  // ── 유저: 신고 제출 ────────────────────────────────────────────
  @Post('reports')
  @ApiOperation({ summary: '콘텐츠 신고' })
  create(@CurrentUser() user: any, @Body() dto: CreateReportDto) {
    return this.reportService.create(user.id, dto);
  }

  // ── 어드민: 신고 목록 / 처리 ──────────────────────────────────
  @Get('admin/reports')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR)
  @ApiOperation({ summary: '[Admin] 신고 목록' })
  @ApiQuery({ name: 'status', enum: ReportStatus, required: false })
  findAll(@Query('status') status?: ReportStatus) {
    return this.reportService.findAll(status);
  }

  @Patch('admin/reports/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MODERATOR)
  @ApiOperation({ summary: '[Admin] 신고 처리' })
  review(@Param('id') id: string, @Body() dto: ReviewReportDto) {
    return this.reportService.review(id, dto);
  }
}
