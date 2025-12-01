import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Posts')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  /**
   * 게시글 생성
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '게시글 생성' })
  @ApiResponse({ status: 201, description: '게시글 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  create(@CurrentUser() user: any, @Body() createPostDto: CreatePostDto) {
    return this.postService.create(user.id, createPostDto);
  }

  /**
   * 게시글 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '게시글 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'boardId', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'viewCount'] })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  @ApiResponse({ status: 200, description: '게시글 목록 조회 성공' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('boardId') boardId?: string,
    @Query('sortBy') sortBy?: 'createdAt' | 'viewCount',
    @Query('order') order?: 'asc' | 'desc',
    @Query('tags') tags?: string[],
  ) {
    return this.postService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      boardId,
      sortBy,
      order,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : undefined,
    });
  }

  /**
   * 게시글 검색
   */
  @Get('search')
  @ApiOperation({ summary: '게시글 검색' })
  @ApiQuery({ name: 'query', required: true, type: String })
  @ApiQuery({ name: 'boardId', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: '검색 결과' })
  search(
    @Query('query') query: string,
    @Query('boardId') boardId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.postService.search({
      query,
      boardId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * 게시글 상세 조회
   */
  @Get(':id')
  @ApiOperation({ summary: '게시글 상세 조회' })
  @ApiResponse({ status: 200, description: '게시글 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없음' })
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  /**
   * 게시글 수정
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '게시글 수정' })
  @ApiResponse({ status: 200, description: '게시글 수정 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없거나 권한 없음' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.update(id, user.id, updatePostDto);
  }

  /**
   * 게시글 삭제
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '게시글 삭제' })
  @ApiResponse({ status: 200, description: '게시글 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '게시글을 찾을 수 없거나 권한 없음' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.postService.remove(id, user.id);
  }
}
