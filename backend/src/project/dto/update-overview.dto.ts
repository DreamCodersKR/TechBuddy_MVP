import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOverviewDto {
  @ApiProperty({
    description: '프로젝트 상세 설명 (Markdown)',
    example: '# 프로젝트 개요\n\n## 목표\n주니어 개발자들의 성장을 돕는 플랫폼...',
  })
  @IsString()
  @IsNotEmpty()
  overview: string;
}
