import { Injectable } from '@nestjs/common';
import { R2Service } from '../document/r2.service';
import { Readable } from 'stream';

@Injectable()
export class TextExtractorService {
  constructor(private r2: R2Service) {}

  /**
   * Extract text content from a document stored in R2.
   * Supports PDF, DOCX, and plain text files.
   * Returns null for unsupported file types.
   */
  async extractText(document: {
    fileType: string;
    r2Key: string;
  }): Promise<string | null> {
    try {
      const stream = await this.r2.getFileStream(document.r2Key);
      const buffer = await this.streamToBuffer(stream);

      // PDF
      if (document.fileType === 'application/pdf') {
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        return result.text || null;
      }

      // DOCX (Word)
      if (
        document.fileType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value || null;
      }

      // Plain text (text/plain, text/markdown, text/csv, etc.)
      if (document.fileType.startsWith('text/')) {
        return buffer.toString('utf-8');
      }

      // Unsupported file type — graceful skip
      console.warn(
        `[TextExtractor] Unsupported file type: ${document.fileType}`,
      );
      return null;
    } catch (err) {
      console.error(
        '[TextExtractor] Failed to extract text:',
        (err as Error).message,
      );
      return null;
    }
  }

  /**
   * Convert a Readable stream to a Buffer.
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}
