import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsArray,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkspaceType } from '@prisma/client';

export class CreateProjectDto {
  @ApiProperty({
    description: '워크스페이스명',
    example: 'FLOWIT MVP',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: '워크스페이스 유형 (기본값: PROJECT)',
    enum: WorkspaceType,
    example: WorkspaceType.PROJECT,
  })
  @IsEnum(WorkspaceType)
  @IsOptional()
  type?: WorkspaceType;

  @ApiPropertyOptional({
    description: '간단 설명',
    example: '주니어 개발자를 위한 포트폴리오 프로젝트',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: '상세 설명 (Markdown)',
    example: '# 프로젝트 개요\n\n## 목표\n...',
  })
  @IsString()
  @IsOptional()
  overview?: string;

  @ApiPropertyOptional({
    description: '기술스택 태그',
    example: ['React', 'NestJS', 'PostgreSQL'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  techStack?: string[];

  @ApiPropertyOptional({
    description: '커버 이미지 URL',
    example: 'https://example.com/cover.png',
  })
  @IsUrl()
  @IsOptional()
  coverImageUrl?: string;

  @ApiPropertyOptional({
    description: 'GitHub 링크 (PROJECT 타입만)',
    example: 'https://github.com/example/repo',
  })
  @IsUrl()
  @IsOptional()
  githubUrl?: string;

  @ApiPropertyOptional({
    description: '시작일 (ISO 8601)',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: '종료일 (ISO 8601)',
    example: '2025-03-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: '공개 여부 (기본값: false)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
