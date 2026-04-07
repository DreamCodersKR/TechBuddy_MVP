import { IsString, IsOptional, IsArray, IsDateString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTilDto {
  @ApiProperty({ example: '오늘 배운 Prisma Transaction' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: '## Prisma Transaction\n...' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({ type: [String], example: ['Prisma', 'NestJS'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ example: '2026-04-08', description: '없으면 오늘 날짜' })
  @IsDateString()
  @IsOptional()
  date?: string;
}

export class UpdateTilDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
