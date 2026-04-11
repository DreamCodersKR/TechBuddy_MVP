import { IsString, IsNotEmpty, IsInt, Min, Max, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgoraDto {
  @ApiProperty({ example: 'NestJS JWT 갱신 시 401 에러 해결 방법' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: '코드 첨부...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  content: string;

  @ApiProperty({ description: '크레딧 현상금 (최소 1, 최대 1000)', example: 10 })
  @IsInt()
  @Min(1)
  @Max(1000)
  bounty: number;
}
