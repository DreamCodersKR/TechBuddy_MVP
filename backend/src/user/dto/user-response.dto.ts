import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: '사용자 고유 ID',
    example: 'cm3yh6kfr0000h5e8dydk6glc',
  })
  id: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '닉네임',
    example: 'gildong',
    nullable: true,
  })
  nickname: string | null;

  @ApiProperty({
    description: '프로필 이미지 URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({
    description: '자기소개',
    example: '안녕하세요, 백엔드 개발자입니다.',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    description: '사용자 역할',
    example: 'USER',
    enum: ['USER', 'ADMIN'],
  })
  role: string;

  @ApiProperty({
    description: '기술 스택 목록',
    example: ['NestJS', 'TypeScript', 'PostgreSQL'],
    type: [String],
  })
  techStack: string[];

  @ApiProperty({
    description: '계정 생성일',
    example: '2025-11-27T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '계정 수정일',
    example: '2025-11-27T00:00:00.000Z',
  })
  updatedAt: Date;

  @Exclude()
  password: string | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
