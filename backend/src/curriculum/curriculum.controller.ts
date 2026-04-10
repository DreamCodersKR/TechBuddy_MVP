import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurriculumService } from './curriculum.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('AI Curriculum')
@Controller('ai-mentor/curriculum')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CurriculumController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Get()
  @ApiOperation({ summary: '주간 학습 추천 조회 (24시간 캐시)' })
  @ApiResponse({ status: 200, description: '추천 항목 반환' })
  getRecommendation(@CurrentUser() user: any) {
    return this.curriculum.getOrGenerate(user.id);
  }

  @Post('regenerate')
  @ApiOperation({ summary: '학습 추천 강제 재생성' })
  @ApiResponse({ status: 201, description: '새로운 추천 생성' })
  regenerate(@CurrentUser() user: any) {
    return this.curriculum.generate(user.id);
  }
}
