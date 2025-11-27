import {
  IsString,
  IsOptional,
  IsArray,
  MinLength,
  IsEnum,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  nickname?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsArray()
  @IsOptional()
  techStack?: string[];

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
