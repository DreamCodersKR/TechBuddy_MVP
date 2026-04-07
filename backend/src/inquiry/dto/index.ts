import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InquiryType, InquiryStatus } from '@prisma/client';

export class CreateInquiryDto {
  @ApiProperty({ enum: InquiryType })
  @IsEnum(InquiryType)
  type: InquiryType;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  content: string;
}

export class ReplyInquiryDto {
  @ApiProperty({ description: '관리자 답변' })
  @IsString()
  @MinLength(5)
  reply: string;

  @ApiPropertyOptional({ enum: InquiryStatus, default: InquiryStatus.RESOLVED })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus = InquiryStatus.RESOLVED;
}
