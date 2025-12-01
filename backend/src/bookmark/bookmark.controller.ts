import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BookmarkService } from './bookmark.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Bookmarks')
@Controller('bookmarks')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  /**
   * 북마크 토글
   */
  @Post('post/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '북마크 토글 (추가/취소)' })
  @ApiResponse({ status: 200, description: '북마크 상태 변경 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  toggle(@CurrentUser() user: any, @Param('postId') postId: string) {
    return this.bookmarkService.toggle(user.id, postId);
  }

  /**
   * 북마크 상태 확인
   */
  @Get('post/:postId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '북마크 상태 확인' })
  @ApiResponse({ status: 200, description: '북마크 상태 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  getStatus(@CurrentUser() user: any, @Param('postId') postId: string) {
    return this.bookmarkService.getStatus(user.id, postId);
  }

  /**
   * 내 북마크 목록 조회
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 북마크 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '북마크 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  findMyBookmarks(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bookmarkService.findMyBookmarks(user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
