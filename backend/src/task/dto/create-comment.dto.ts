import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTaskCommentDto {
  @ApiProperty({ example: '이 부분은 useEffect 의존성 배열을 확인해보세요.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}
