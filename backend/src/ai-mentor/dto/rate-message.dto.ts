import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class RateMessageDto {
  @ApiProperty({ description: '1=좋아요, -1=싫어요', enum: [1, -1] })
  @IsIn([1, -1])
  rating: 1 | -1;
}
