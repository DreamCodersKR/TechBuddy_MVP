import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CoffeeChatService } from './coffee-chat.service';
import { CreateCoffeeChatDto, AcceptCoffeeChatDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('CoffeeChat')
@Controller('coffee-chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoffeeChatController {
  constructor(private readonly coffeeChatService: CoffeeChatService) {}

  @Post()
  @ApiOperation({ summary: '커피챗 요청 (10 크레딧 차감)' })
  create(@CurrentUser() user: any, @Body() dto: CreateCoffeeChatDto) {
    return this.coffeeChatService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: '내 커피챗 목록 조회' })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['sent', 'received'],
    description: 'sent: 내가 보낸, received: 내가 받은, 미지정: 전체',
  })
  findMine(@CurrentUser() user: any, @Query('role') role?: string) {
    return this.coffeeChatService.findMine(user.id, role);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: '커피챗 수락 (받은 사람만)' })
  accept(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: AcceptCoffeeChatDto,
  ) {
    return this.coffeeChatService.accept(id, user.id, dto);
  }

  @Patch(':id/decline')
  @ApiOperation({ summary: '커피챗 거절 (받은 사람만, 크레딧 환불)' })
  decline(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coffeeChatService.decline(id, user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '커피챗 취소 (보낸 사람만, 크레딧 환불)' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.coffeeChatService.cancel(id, user.id);
  }
}
