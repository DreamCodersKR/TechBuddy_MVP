import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserPlan } from '@prisma/client';
import { Type } from 'class-transformer';

export class AdminUsersQueryDto {
  @ApiPropertyOptional({ description: '검색어 (이름, 이메일, 닉네임)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserPlan })
  @IsOptional()
  @IsEnum(UserPlan)
  plan?: UserPlan;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserPlanDto {
  @ApiProperty({ enum: UserPlan })
  @IsEnum(UserPlan)
  plan: UserPlan;
}

export class AdjustCreditsDto {
  @ApiProperty({ description: '지급(+) 또는 차감(-) 크레딧 수' })
  @IsInt()
  amount: number;

  @ApiProperty({ description: '사유' })
  @IsString()
  reason: string;
}
