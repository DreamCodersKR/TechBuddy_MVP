import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: '게시글 ID',
    example: 'post-uuid',
  })
  @IsString()
  @IsNotEmpty()
  postId: string;

  @ApiProperty({
    description: '댓글 내용',
    example: '좋은 글 감사합니다!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: '부모 댓글 ID (대댓글인 경우)',
    example: 'parent-comment-uuid',
  })
  @IsString()
  @IsOptional()
  parentId?: string;
}
