import {
  IsString,
  IsOptional,
  IsArray,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({
    description: '새 비밀번호',
    example: 'newPassword123',
    minLength: 8,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  password?: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '김철수',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: '닉네임',
    example: 'cheolsu',
    required: false,
  })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    description: '자기소개',
    example: '안녕하세요, 풀스택 개발자입니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({
    description: '기술 스택 목록',
    example: ['TypeScript', 'Vue.js', 'NestJS'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsOptional()
  techStack?: string[];

  @ApiProperty({
    description: '사용자 역할 (관리자만 변경 가능)',
    enum: UserRole,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
