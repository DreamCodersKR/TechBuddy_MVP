import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole, InquiryStatus } from '@prisma/client';
import { InquiryService } from './inquiry.service';
import { CreateInquiryDto, ReplyInquiryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators';

@ApiTags('Support')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InquiryController {
  constructor(private readonly inquiryService: InquiryService) {}

  // ── 유저 라우트 (/support) ─────────────────────────────────────
  @Post('support/inquiries')
  @ApiOperation({ summary: '문의 작성' })
  create(@CurrentUser() user: any, @Body() dto: CreateInquiryDto) {
    return this.inquiryService.create(user.id, dto);
  }

  @Get('support/inquiries')
  @ApiOperation({ summary: '내 문의 목록' })
  findMine(@CurrentUser() user: any) {
    return this.inquiryService.findMyInquiries(user.id);
  }

  @Get('support/inquiries/:id')
  @ApiOperation({ summary: '내 문의 상세' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.inquiryService.findMyInquiryById(id, user.id);
  }

  // ── 어드민 라우트 (/admin/inquiries) ──────────────────────────
  @Get('admin/inquiries')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] 전체 문의 목록' })
  @ApiQuery({ name: 'status', enum: InquiryStatus, required: false })
  findAll(@Query('status') status?: InquiryStatus) {
    return this.inquiryService.findAll(status);
  }

  @Patch('admin/inquiries/:id/reply')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: '[Admin] 문의 답변' })
  reply(@Param('id') id: string, @Body() dto: ReplyInquiryDto) {
    return this.inquiryService.reply(id, dto);
  }
}
