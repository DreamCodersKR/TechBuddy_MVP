import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentCategory } from '@prisma/client';
import { memoryStorage } from 'multer';
import type { Response } from 'express';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'image/png',
  'image/jpeg',
  'image/gif',
];

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @ApiOperation({ summary: '파일 업로드' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
      fileFilter: (_, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(new BadRequestException('허용되지 않는 파일 형식입니다.'), false);
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @Param('workspaceId') workspaceId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateDocumentDto,
    @Req() req,
  ) {
    if (!file) throw new BadRequestException('파일을 첨부해주세요.');
    return this.documentService.uploadDocument(workspaceId, req.user.id, file, dto.category);
  }

  @Get()
  @ApiOperation({ summary: '문서 목록 조회' })
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query('category') category?: DocumentCategory,
  ) {
    return this.documentService.findAll(workspaceId, category);
  }

  @Post('download-zip')
  @ApiOperation({ summary: 'ZIP 다운로드' })
  async downloadZip(
    @Param('workspaceId') _workspaceId: string,
    @Body('documentIds') documentIds: string[],
    @Res() res: Response,
  ) {
    if (!documentIds?.length) throw new BadRequestException('documentIds가 필요합니다.');
    await this.documentService.streamZipDownload(documentIds, res);
  }

  @Get(':documentId/download')
  @ApiOperation({ summary: '단일 파일 다운로드' })
  async download(
    @Param('documentId') documentId: string,
    @Res() res: Response,
  ) {
    await this.documentService.streamDownload(documentId, res);
  }

  @Delete(':documentId')
  @ApiOperation({ summary: '문서 삭제' })
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('documentId') documentId: string,
    @Req() req,
  ) {
    return this.documentService.remove(documentId, req.user.id, workspaceId);
  }
}
