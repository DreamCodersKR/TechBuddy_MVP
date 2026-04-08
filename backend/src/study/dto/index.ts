import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsBoolean, IsDateString, IsUrl, Min, IsIn } from 'class-validator';

// ─── StudyWeek ─────────────────────────────────────────────────────────────

export class CreateStudyWeekDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  weekNumber: number;

  @ApiProperty({ example: '1주차: TypeScript 기초' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'TypeScript 기본 타입을 이해한다' })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateStudyWeekDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ─── StudyAssignment ────────────────────────────────────────────────────────

export class CreateStudyAssignmentDto {
  @ApiProperty({ example: '타입스크립트 인터페이스 예제 3개 작성' })
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateStudyAssignmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

// ─── StudyAssignmentSubmission ──────────────────────────────────────────────

export class CreateSubmissionDto {
  @ApiPropertyOptional({ example: 'https://github.com/user/repo/commit/abc' })
  @IsOptional()
  @IsString()
  proofUrl?: string;

  @ApiPropertyOptional({ example: '오늘 TypeScript 기초 학습 완료. 인터페이스 예제 작성함.' })
  @IsOptional()
  @IsString()
  content?: string;
}

// ─── StudyPenaltyRule ───────────────────────────────────────────────────────

export class UpsertPenaltyRuleDto {
  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  depositAmount: number;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(0)
  penaltyPerMiss: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  periodEnd?: string;
}

// ─── StudyResource ──────────────────────────────────────────────────────────

export class CreateStudyResourceDto {
  @ApiProperty({ example: 'TypeScript 공식 문서' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'https://www.typescriptlang.org/docs/' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiProperty({ example: 'LINK', enum: ['LINK', 'FILE', 'VIDEO', 'OTHER'] })
  @IsIn(['LINK', 'FILE', 'VIDEO', 'OTHER'])
  category: string;
}
