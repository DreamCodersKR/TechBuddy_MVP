import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

export interface RagResult {
  documentId: string;
  fileName: string;
  chunkIndex: number;
  content: string;
  similarity: number;
}

@Injectable()
export class RagService {
  constructor(
    private prisma: PrismaService,
    private embeddingService: EmbeddingService,
  ) {}

  /**
   * Search for relevant document chunks using cosine similarity via pgvector.
   * @param query - User's query text
   * @param projectId - Project to search within
   * @param topK - Maximum number of results to return
   * @param threshold - Minimum cosine similarity (0-1)
   */
  async search(
    query: string,
    projectId: string,
    topK = 3,
    threshold = 0.7,
  ): Promise<RagResult[]> {
    // 1. Generate query embedding
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    if (!queryEmbedding) {
      return [];
    }

    // 2. Build vector string for pgvector
    const vectorStr = `[${queryEmbedding.join(',')}]`;

    // 3. Query pgvector with cosine distance operator (<=>)
    // Note: Using $queryRawUnsafe because pgvector operators don't work with tagged templates
    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        documentId: string;
        chunkIndex: number;
        content: string;
        fileName: string;
        similarity: number;
      }>
    >(
      `SELECT de.id, de."documentId", de."chunkIndex", de.content, d."fileName",
              1 - (de.embedding <=> $1::vector) AS similarity
       FROM document_embeddings de
       JOIN documents d ON d.id = de."documentId"
       WHERE de."projectId" = $2
         AND d."deletedAt" IS NULL
         AND 1 - (de.embedding <=> $1::vector) >= $3
       ORDER BY de.embedding <=> $1::vector
       LIMIT $4`,
      vectorStr,
      projectId,
      threshold,
      topK,
    );

    // 4. Map to RagResult interface
    return results.map((r) => ({
      documentId: r.documentId,
      fileName: r.fileName,
      chunkIndex: r.chunkIndex,
      content: r.content,
      similarity: Number(r.similarity),
    }));
  }
}
