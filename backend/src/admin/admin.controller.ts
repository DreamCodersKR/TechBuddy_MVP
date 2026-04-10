import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole, UserPlan } from '@prisma/client';
import { AdminService } from './admin.service';
import { AdminUsersQueryDto, UpdateUserRoleDto, UpdateUserPlanDto, AdjustCreditsDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: '서비스 운영 통계' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: '유저 목록 (검색/필터)' })
  getUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '유저 상세' })
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/role')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '역할 변경 (SUPER_ADMIN 전용)' })
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateUserRole(id, dto.role, user.id);
  }

  @Patch('users/:id/plan')
  @ApiOperation({ summary: '플랜 변경' })
  updateUserPlan(@Param('id') id: string, @Body() dto: UpdateUserPlanDto) {
    return this.adminService.updateUserPlan(id, dto.plan);
  }

  @Post('users/:id/credits')
  @ApiOperation({ summary: '크레딧 수동 지급/차감' })
  adjustCredits(@Param('id') id: string, @Body() dto: AdjustCreditsDto) {
    return this.adminService.adjustCredits(id, dto);
  }

  @Post('users/:id/ban')
  @ApiOperation({ summary: '계정 정지' })
  banUser(@Param('id') id: string) {
    return this.adminService.banUser(id, true);
  }

  @Post('users/:id/unban')
  @ApiOperation({ summary: '계정 정지 해제' })
  unbanUser(@Param('id') id: string) {
    return this.adminService.banUser(id, false);
  }

  @Get('moderation')
  @ApiOperation({ summary: '숨겨진 콘텐츠 목록 (AI 검열)' })
  getModerationList(@Query('type') type?: string) {
    return this.adminService.getModerationList(type);
  }

  @Patch('moderation/:type/:id/restore')
  @ApiOperation({ summary: '숨겨진 콘텐츠 복원' })
  restoreContent(@Param('type') type: string, @Param('id') id: string) {
    return this.adminService.restoreContent(type, id);
  }
}
