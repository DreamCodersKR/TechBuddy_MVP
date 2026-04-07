import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { ReferralService } from './referral.service';

@ApiTags('Referral')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('referral')
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('my-code')
  @ApiOperation({ summary: '내 초대 코드 조회 (없으면 자동 생성)' })
  getMyCode(@CurrentUser() user: any) {
    return this.referralService.getMyCode(user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: '초대 현황 (초대한 사람 수, 총 보상 크레딧)' })
  getStats(@CurrentUser() user: any) {
    return this.referralService.getStats(user.id);
  }
}
