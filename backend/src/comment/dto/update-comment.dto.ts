import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCommentDto {
  @ApiProperty({
    description: '댓글 내용',
    example: '수정된 댓글입니다.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
