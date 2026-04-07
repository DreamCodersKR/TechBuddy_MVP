import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response } from 'express';
import { AiMentorService } from './ai-mentor.service';
import { CreateMessageDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('AI Mentor')
@Controller('ai-mentor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiMentorController {
  constructor(private readonly aiMentorService: AiMentorService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'AI 멘토링 대화 목록' })
  getConversations(@CurrentUser() user: any) {
    return this.aiMentorService.getConversations(user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: '대화 상세 (메시지 포함)' })
  getConversation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.aiMentorService.getConversation(id, user.id);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: '대화 삭제' })
  deleteConversation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.aiMentorService.deleteConversation(id, user.id);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: '메시지 전송 (기존 대화에 이어서)' })
  sendMessageToConversation(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateMessageDto,
  ) {
    return this.aiMentorService.sendMessage(id, user.id, dto);
  }

  @Post('messages')
  @ApiOperation({ summary: '새 대화 시작 + 첫 메시지 전송' })
  sendMessage(@CurrentUser() user: any, @Body() dto: CreateMessageDto) {
    return this.aiMentorService.sendMessage(null, user.id, dto);
  }

  @Post('messages/stream')
  @ApiOperation({ summary: '새 대화 시작 + 첫 메시지 전송 (SSE 스트리밍)' })
  streamNewMessage(
    @CurrentUser() user: any,
    @Body() dto: CreateMessageDto,
    @Res() res: Response,
  ) {
    return this.aiMentorService.streamMessage(null, user.id, dto, res);
  }

  @Post('conversations/:id/messages/stream')
  @ApiOperation({ summary: '메시지 전송 (SSE 스트리밍)' })
  streamConversationMessage(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateMessageDto,
    @Res() res: Response,
  ) {
    return this.aiMentorService.streamMessage(id, user.id, dto, res);
  }
}
