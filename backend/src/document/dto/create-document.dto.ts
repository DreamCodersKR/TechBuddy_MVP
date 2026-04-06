import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentCategory } from '@prisma/client';

export class CreateDocumentDto {
  @ApiPropertyOptional({ enum: DocumentCategory, example: DocumentCategory.PLANNING })
  @IsEnum(DocumentCategory)
  @IsOptional()
  category?: DocumentCategory;
}
