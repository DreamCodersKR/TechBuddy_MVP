import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다' })
  @IsNotEmpty({ message: '이메일은 필수입니다' })
  email: string;

  @ApiProperty({
    description: '비밀번호 (최소 8자 이상)',
    example: 'password123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수입니다' })
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다' })
  password: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  @IsString()
  @IsNotEmpty({ message: '이름은 필수입니다' })
  name: string;

  @ApiProperty({
    description: '닉네임 (선택사항)',
    example: 'gildong',
    required: false,
  })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({
    description: '프로필 이미지 URL (선택사항)',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiProperty({
    description: '자기소개 (선택사항)',
    example: '안녕하세요, 백엔드 개발자입니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({
    description: '기술 스택 목록 (선택사항)',
    example: ['NestJS', 'TypeScript', 'PostgreSQL'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  techStack?: string[];
}
