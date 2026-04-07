import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';
import { TilService } from './til.service';
import { CreateTilDto, UpdateTilDto } from './til.dto';

@ApiTags('TIL')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tils')
export class TilController {
  constructor(private readonly tilService: TilService) {}

  @Post()
  @ApiOperation({ summary: 'TIL 작성 (하루 1개)' })
  create(@CurrentUser() user: any, @Body() dto: CreateTilDto) {
    return this.tilService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'TIL 피드 목록' })
  @ApiQuery({ name: 'authorId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('authorId') authorId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tilService.findAll(authorId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('heatmap')
  @ApiOperation({ summary: '잔디 히트맵 데이터 (내 것)' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getHeatmap(@CurrentUser() user: any, @Query('year') year?: string) {
    return this.tilService.getHeatmap(user.id, year ? Number(year) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'TIL 단건 조회' })
  findOne(@Param('id') id: string) {
    return this.tilService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'TIL 수정 (본인만)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateTilDto,
  ) {
    return this.tilService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'TIL 삭제 (본인만)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tilService.remove(id, user.id);
  }
}
