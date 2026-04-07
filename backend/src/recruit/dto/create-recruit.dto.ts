import {
  IsString, IsNotEmpty, IsEnum, IsArray, IsInt, Min, IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecruitType } from '@prisma/client';

export class CreateRecruitDto {
  @ApiProperty({ description: '연결된 워크스페이스 ID' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ enum: RecruitType, example: RecruitType.PROJECT })
  @IsEnum(RecruitType)
  type: RecruitType;

  @ApiProperty({ example: '풀스택 개발자 모집' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '포트폴리오 프로젝트 팀원을 모집합니다...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: ['프론트엔드', '백엔드'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  positions: string[];

  @ApiProperty({ example: 4 })
  @IsInt()
  @Min(1)
  maxMembers: number;

  @ApiProperty({ example: '2025-04-30' })
  @IsDateString()
  @IsNotEmpty()
  deadline: string;
}
