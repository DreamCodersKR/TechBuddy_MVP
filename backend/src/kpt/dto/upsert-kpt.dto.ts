import { IsArray, IsString, MaxLength, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpsertKptDto {
  @ApiProperty({ description: 'Keep 항목 (잘한 점)', type: [String], example: ['코드 리뷰를 매일 진행했다'] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  @ArrayMaxSize(20)
  keeps: string[];

  @ApiProperty({ description: 'Problem 항목 (문제점)', type: [String], example: ['배포 프로세스가 느렸다'] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  @ArrayMaxSize(20)
  problems: string[];

  @ApiProperty({ description: 'Try 항목 (시도할 점)', type: [String], example: ['CI/CD 파이프라인 개선'] })
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  @ArrayMaxSize(20)
  tries: string[];
}
