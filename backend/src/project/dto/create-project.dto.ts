import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    description: '프로젝트명',
    example: 'FLOWIT MVP',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: '프로젝트 간단 설명',
    example: '주니어 개발자를 위한 프로젝트 매칭 플랫폼',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: '프로젝트 상세 설명 (Markdown)',
    example: '# 프로젝트 개요\n\n## 목표\n...',
  })
  @IsString()
  @IsOptional()
  overview?: string;

  @ApiPropertyOptional({
    description: '프로젝트 시작일 (ISO 8601)',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: '프로젝트 종료일 (ISO 8601)',
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

  @ApiProperty({
    description: '소속 기관 ID',
    example: 'organization-uuid',
  })
  @IsString()
  @IsNotEmpty()
  organizationId: string;
}
