import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TextExtractorService } from './text-extractor.service';
import { EmbeddingService } from './embedding.service';

@Injectable()
export class EmbeddingPipelineService {
  constructor(
    private prisma: PrismaService,
    private textExtractor: TextExtractorService,
    private embeddingService: EmbeddingService,
  ) {}

  /**
   * Main pipeline: extract text from document, chunk it, generate embeddings, and store.
   */
  async processDocument(documentId: string): Promise<void> {
    // 1. Fetch document from DB
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        projectId: true,
        fileType: true,
        r2Key: true,
        deletedAt: true,
      },
    });

    if (!document || document.deletedAt) {
      console.warn(
        `[EmbeddingPipeline] Document ${documentId} not found or deleted — skipping`,
      );
      return;
    }

    // 2. Extract text
    const text = await this.textExtractor.extractText({
      fileType: document.fileType,
      r2Key: document.r2Key,
    });

    if (!text || text.trim().length < 10) {
      console.warn(
        `[EmbeddingPipeline] No extractable text for document ${documentId} — skipping`,
      );
      return;
    }

    // 3. Chunk text
    const chunks = this.chunkText(text, 1000, 200);

    // 4. Generate batch embeddings
    const embeddings =
      await this.embeddingService.generateBatchEmbeddings(chunks);

    // 5. Delete existing embeddings for this document
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM document_embeddings WHERE "documentId" = $1`,
      documentId,
    );

    // 6. Insert each chunk + embedding
    for (let i = 0; i < chunks.length; i++) {
      const embedding = embeddings[i];
      if (!embedding) continue; // Skip failed embeddings

      const vectorStr = `[${embedding.join(',')}]`;
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO document_embeddings ("documentId", "projectId", "chunkIndex", content, embedding)
         VALUES ($1, $2, $3, $4, $5::vector)`,
        documentId,
        document.projectId,
        i,
        chunks[i],
        vectorStr,
      );
    }

    console.log(
      `[EmbeddingPipeline] Processed document ${documentId}: ${chunks.length} chunks embedded`,
    );
  }

  /**
   * Remove all embeddings for a given document (used on document deletion).
   */
  async removeEmbeddings(documentId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM document_embeddings WHERE "documentId" = $1`,
      documentId,
    );
  }

  /**
   * Split text into overlapping chunks.
   * @param text - Full text to chunk
   * @param size - Maximum characters per chunk
   * @param overlap - Number of overlapping characters between consecutive chunks
   */
  private chunkText(text: string, size: number, overlap: number): string[] {
    const chunks: string[] = [];
    const cleanedText = text.replace(/\s+/g, ' ').trim();

    if (cleanedText.length <= size) {
      return [cleanedText];
    }

    let start = 0;
    while (start < cleanedText.length) {
      const end = Math.min(start + size, cleanedText.length);
      chunks.push(cleanedText.slice(start, end));
      start += size - overlap;
    }

    return chunks;
  }
}
