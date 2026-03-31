import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyRecruitDto {
  @ApiPropertyOptional({ example: '안녕하세요, 프론트엔드 개발 경험이 있습니다...' })
  @IsString()
  @IsOptional()
  message?: string;
}
