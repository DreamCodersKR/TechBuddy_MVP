import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AgoraService } from './agora.service';
import { CreateAgoraDto, CreateAgoraAnswerDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Agora')
@Controller('agora')
export class AgoraController {
  constructor(private readonly agoraService: AgoraService) {}

  @Get()
  @ApiOperation({ summary: '아고라 질문 목록' })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'CLOSED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.agoraService.findAll({
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '아고라 질문 상세 (답변 포함)' })
  findOne(@Param('id') id: string) {
    return this.agoraService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '아고라 질문 작성 (크레딧 현상금 필수)' })
  create(@CurrentUser() user: any, @Body() dto: CreateAgoraDto) {
    return this.agoraService.create(user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '아고라 질문 삭제 (답변 0개일 때만, 현상금 환불)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.agoraService.remove(id, user.id);
  }

  // 답변
  @Post(':id/answers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '답변 작성 (질문 작성자 본인 불가)' })
  createAnswer(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: CreateAgoraAnswerDto,
  ) {
    return this.agoraService.createAnswer(id, user.id, dto);
  }

  @Delete(':id/answers/:answerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '답변 삭제 (작성자만, 채택 전)' })
  removeAnswer(
    @Param('id') id: string,
    @Param('answerId') answerId: string,
    @CurrentUser() user: any,
  ) {
    return this.agoraService.removeAnswer(id, answerId, user.id);
  }

  @Post(':id/answers/:answerId/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '답변 채택 (질문 작성자만, 현상금 자동 지급)' })
  acceptAnswer(
    @Param('id') id: string,
    @Param('answerId') answerId: string,
    @CurrentUser() user: any,
  ) {
    return this.agoraService.acceptAnswer(id, answerId, user.id);
  }
}
