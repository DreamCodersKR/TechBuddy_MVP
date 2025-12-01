import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: '게시판 ID',
    example: 'board-uuid',
  })
  @IsString()
  @IsNotEmpty()
  boardId: string;

  @ApiProperty({
    description: '게시글 제목',
    example: 'NestJS 질문 있습니다',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: '게시글 내용 (Markdown 지원)',
    example: '# 질문\n\nNestJS에서 Guard는 어떻게 사용하나요?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: '태그 목록',
    example: ['NestJS', 'TypeScript'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: '게시 여부 (기본값: true)',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
