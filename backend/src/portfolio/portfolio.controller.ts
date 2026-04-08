import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  /**
   * 내 포트폴리오 설정 조회
   */
  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 포트폴리오 공개 설정 조회' })
  getMySettings(@CurrentUser() user: any) {
    return this.portfolioService.getMySettings(user.id);
  }

  /**
   * 포트폴리오 공개 설정 업데이트
   */
  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '포트폴리오 공개 설정 업데이트' })
  updateSettings(
    @CurrentUser() user: any,
    @Body() body: { portfolioPublic?: boolean; portfolioSections?: Record<string, boolean> },
  ) {
    return this.portfolioService.updateSettings(user.id, body);
  }

  /**
   * 워크스페이스 Verified 상태 조회
   */
  @Get('verified/:projectId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '프로젝트 Verified 인증 상태 조회' })
  getVerifiedStatus(@Param('projectId') projectId: string) {
    return this.portfolioService.getProjectVerifiedStatus(projectId);
  }

  /**
   * 공개 포트폴리오 조회 (인증 불필요)
   * 순서 중요: settings, verified 뒤에 :nickname 위치
   */
  @Get(':nickname')
  @ApiOperation({ summary: '공개 포트폴리오 조회 (인증 불필요)' })
  getPortfolio(@Param('nickname') nickname: string) {
    return this.portfolioService.getPortfolio(nickname);
  }
}
