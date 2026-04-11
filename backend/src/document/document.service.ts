import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from './r2.service';
import { EmbeddingPipelineService } from '../embedding/embedding-pipeline.service';
import { DocumentCategory } from '@prisma/client';
import * as archiver from 'archiver';
import { randomUUID } from 'crypto';
import type { Response } from 'express';

// DRE-221: 업로드 허용 MIME 타입 (실행 파일/스크립트 차단)
const BLOCKED_MIME = [
  'application/x-executable', 'application/x-msdownload', 'application/x-sh',
  'application/x-bat', 'text/x-script.phyton', 'application/x-php',
  'application/javascript', 'text/javascript', 'application/x-httpd-php',
];
const MAX_DOC_SIZE = 50 * 1024 * 1024; // 50MB

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private prisma: PrismaService,
    private r2: R2Service,
    private embeddingPipeline: EmbeddingPipelineService,
  ) {}

  async uploadDocument(
    projectId: string,
    uploadedById: string,
    file: Express.Multer.File,
    category: DocumentCategory = DocumentCategory.OTHER,
  ) {
    // DRE-221: 파일 크기 및 위험 MIME 타입 차단
    if (file.size > MAX_DOC_SIZE) {
      throw new BadRequestException('파일 크기는 50MB 이하여야 합니다');
    }
    if (BLOCKED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('업로드할 수 없는 파일 형식입니다');
    }

    const ext = file.originalname.split('.').pop();
    const r2Key = `${projectId}/${randomUUID()}-${file.originalname}`;
    const fileUrl = await this.r2.uploadFile(r2Key, file.buffer, file.mimetype);

    const doc = await this.prisma.document.create({
      data: {
        projectId,
        uploadedById,
        fileName: file.originalname,
        fileUrl,
        r2Key,
        fileSize: file.size,
        fileType: file.mimetype,
        category,
      },
      include: {
        uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Fire-and-forget: generate embeddings for RAG
    this.embeddingPipeline.processDocument(doc.id).catch((err) => {
      this.logger.warn(`임베딩 파이프라인 실패 (doc ${doc.id}): ${err.message}`);
    });

    return doc;
  }

  async findAll(projectId: string, category?: DocumentCategory) {
    return this.prisma.document.findMany({
      where: {
        projectId,
        deletedAt: null,
        ...(category ? { category } : {}),
      },
      include: {
        uploadedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async streamDownload(documentId: string, res: Response) {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('문서를 찾을 수 없습니다.');

    const stream = await this.r2.getFileStream(doc.r2Key);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`);
    res.setHeader('Content-Type', doc.fileType);
    stream.pipe(res);
  }

  async streamZipDownload(documentIds: string[], res: Response) {
    const docs = await this.prisma.document.findMany({
      where: { id: { in: documentIds }, deletedAt: null },
    });
    if (!docs.length) throw new NotFoundException('문서를 찾을 수 없습니다.');

    res.setHeader('Content-Disposition', 'attachment; filename="documents.zip"');
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver.default('zip', { zlib: { level: 6 } });
    archive.pipe(res);

    for (const doc of docs) {
      const stream = await this.r2.getFileStream(doc.r2Key);
      archive.append(stream, { name: doc.fileName });
    }

    await archive.finalize();
  }

  async remove(documentId: string, userId: string, projectId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id: documentId, projectId, deletedAt: null },
    });
    if (!doc) throw new NotFoundException('문서를 찾을 수 없습니다.');

    // ADMIN만 삭제 가능 (본인 업로드 or ADMIN)
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (doc.uploadedById !== userId && member?.role !== 'ADMIN') {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }

    await this.r2.deleteFile(doc.r2Key);
    await this.prisma.document.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    // Fire-and-forget: remove embeddings for deleted document
    this.embeddingPipeline.removeEmbeddings(documentId).catch((err) => this.logger.warn(`임베딩 삭제 실패 (doc ${documentId}): ${err.message}`));
  }
}
