import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SprintStatus } from '@prisma/client';

export class CreateSprintDto {
  @ApiProperty({ example: 'Sprint 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: '로그인/회원가입 기능 완성' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  goal?: string;

  @ApiPropertyOptional({ example: '2025-04-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-04-14' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ enum: SprintStatus, example: SprintStatus.PLANNED })
  @IsEnum(SprintStatus)
  @IsOptional()
  status?: SprintStatus;
}
