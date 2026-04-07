import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { QuestService } from './quest.service';

@ApiTags('Quest')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quests')
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  @Get('daily')
  @ApiOperation({ summary: '오늘의 퀘스트 목록 + 진행 상황' })
  getDailyQuests(@CurrentUser() user: any) {
    return this.questService.getDailyQuests(user.id);
  }
}
