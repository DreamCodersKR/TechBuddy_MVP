import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Likes')
@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  /**
   * 좋아요 토글
   */
  @Post('post/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '좋아요 토글 (추가/취소)' })
  @ApiResponse({ status: 200, description: '좋아요 상태 변경 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  toggle(@CurrentUser() user: any, @Param('postId') postId: string) {
    return this.likeService.toggle(user.id, postId);
  }

  /**
   * 좋아요 상태 확인 (로그인 사용자)
   */
  @Get('post/:postId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '좋아요 상태 확인 (본인)' })
  @ApiResponse({ status: 200, description: '좋아요 상태 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  getStatus(@CurrentUser() user: any, @Param('postId') postId: string) {
    return this.likeService.getStatus(user.id, postId);
  }

  /**
   * 게시글 좋아요 수 조회
   */
  @Get('post/:postId/count')
  @ApiOperation({ summary: '게시글 좋아요 수 조회' })
  @ApiResponse({ status: 200, description: '좋아요 수 조회 성공' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  getCount(@Param('postId') postId: string) {
    return this.likeService.getCount(postId);
  }
}
