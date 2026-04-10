import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCoffeeChatDto {
  @ApiProperty({ description: '받는 사람 ID' })
  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @ApiProperty({ description: '요청 메시지', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  message: string;
}
