import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskType } from '@prisma/client';

// 1=기본(1cr), 2=심화(10cr), 3=전문가(50cr)
export enum MentoringTier {
  BASIC = 1,
  ADVANCED = 2,
  EXPERT = 3,
}

const TIER_COST = { [MentoringTier.BASIC]: 1, [MentoringTier.ADVANCED]: 10, [MentoringTier.EXPERT]: 50 };
export { TIER_COST };

export class CreateMessageDto {
  @ApiProperty({ example: '이 코드에서 메모리 누수가 발생하는 이유가 뭔가요?' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ enum: TaskType, example: TaskType.CODE })
  @IsEnum(TaskType)
  taskType: TaskType;

  @ApiProperty({ description: '멘토링 등급 (1=기본 1cr, 2=심화 10cr, 3=전문가 50cr)', example: 1 })
  @IsInt()
  @Min(1)
  @Max(3)
  tier: MentoringTier;

  @ApiPropertyOptional({ description: '첨부할 Task ID (Help 상태 연동)' })
  @IsString()
  @IsOptional()
  taskId?: string;
}
