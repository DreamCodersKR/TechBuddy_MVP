import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({ example: '수정된 코멘트 내용입니다.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
