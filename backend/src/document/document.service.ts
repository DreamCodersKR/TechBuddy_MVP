import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { R2Service } from './r2.service';
import { DocumentCategory } from '@prisma/client';
import * as archiver from 'archiver';
import { randomUUID } from 'crypto';
import type { Response } from 'express';

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaService,
    private r2: R2Service,
  ) {}

  async uploadDocument(
    projectId: string,
    uploadedById: string,
    file: Express.Multer.File,
    category: DocumentCategory = DocumentCategory.OTHER,
  ) {
    const ext = file.originalname.split('.').pop();
    const r2Key = `${projectId}/${randomUUID()}-${file.originalname}`;
    const fileUrl = await this.r2.uploadFile(r2Key, file.buffer, file.mimetype);

    return this.prisma.document.create({
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
  }
}
