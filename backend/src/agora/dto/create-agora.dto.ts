import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgoraDto {
  @ApiProperty({ example: 'NestJS JWT 갱신 시 401 에러 해결 방법' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '코드 첨부...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: '크레딧 현상금 (최소 1)', example: 10 })
  @IsInt()
  @Min(1)
  bounty: number;
}
