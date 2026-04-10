import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptCoffeeChatDto {
  @ApiProperty({ description: '미팅 URL (Google Meet, Zoom 등)', required: false })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: '유효한 URL 형식이어야 합니다' })
  meetingUrl?: string;
}
