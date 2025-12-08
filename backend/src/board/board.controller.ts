import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BoardService } from './board.service';

@ApiTags('Boards')
@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  /**
   * 게시판 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '게시판 목록 조회' })
  @ApiResponse({ status: 200, description: '게시판 목록 조회 성공' })
  findAll() {
    return this.boardService.findAll();
  }

  /**
   * 게시판 단일 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '게시판 상세 조회' })
  @ApiResponse({ status: 200, description: '게시판 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '게시판을 찾을 수 없음' })
  findOne(@Param('id') id: string) {
    return this.boardService.findOne(id);
  }
}
