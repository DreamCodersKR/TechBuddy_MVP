import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportTarget, ReportReason, ReportStatus } from '@prisma/client';

export class CreateReportDto {
  @ApiProperty({ enum: ReportTarget })
  @IsEnum(ReportTarget)
  targetType: ReportTarget;

  @ApiProperty({ description: '신고 대상 ID' })
  @IsString()
  targetId: string;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional({ description: '상세 사유' })
  @IsOptional()
  @IsString()
  detail?: string;
}

export class ReviewReportDto {
  @ApiProperty({ enum: ReportStatus })
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @ApiPropertyOptional({ description: '처리 메모' })
  @IsOptional()
  @IsString()
  memo?: string;
}
