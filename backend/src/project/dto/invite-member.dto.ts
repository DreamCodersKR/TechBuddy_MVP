import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectRole } from '@prisma/client';

export class InviteMemberDto {
  @ApiProperty({
    description: '초대할 사용자 ID',
    example: 'user-uuid',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: '프로젝트 내 역할 (기본값: MEMBER)',
    enum: ProjectRole,
    example: ProjectRole.MEMBER,
  })
  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole;
}
