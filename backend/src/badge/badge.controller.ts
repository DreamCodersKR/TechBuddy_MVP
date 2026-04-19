import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BadgeService } from './badge.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { IsEnum, IsOptional } from 'class-validator';
import { BadgeType } from '@prisma/client';

class UpdateDisplayBadgeDto {
  @IsOptional()
  @IsEnum(BadgeType)
  badgeType: BadgeType | null;
}

@ApiTags('Badges')
@Controller('badges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  @Get('mine')
  @ApiOperation({ summary: '내 뱃지 컬렉션 조회 (보유/미보유 + 진행도)' })
  findMyBadges(@CurrentUser() user: any) {
    return this.badgeService.findMyBadges(user.id);
  }

  @Patch('display')
  @ApiOperation({ summary: '대표 뱃지 변경' })
  setDisplayBadge(@CurrentUser() user: any, @Body() dto: UpdateDisplayBadgeDto) {
    return this.badgeService.setDisplayBadge(user.id, dto.badgeType);
  }
}
