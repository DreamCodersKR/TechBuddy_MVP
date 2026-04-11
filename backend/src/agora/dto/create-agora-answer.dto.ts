import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAgoraAnswerDto {
  @ApiProperty({ example: '해당 에러는 토큰 만료 시...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  content: string;
}
