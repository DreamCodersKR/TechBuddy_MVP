import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MAX_INPUT_CHARS = 6000;

@Injectable()
export class EmbeddingService {
  constructor(private config: ConfigService) {}

  /**
   * Generate embedding for a single text using OpenAI text-embedding-3-small.
   * Returns null gracefully if OPENAI_API_KEY is not configured.
   */
  async generateEmbedding(text: string): Promise<number[] | null> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      console.warn(
        '[Embedding] OPENAI_API_KEY not set — skipping embedding generation',
      );
      return null;
    }

    try {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey });

      const truncated = text.slice(0, MAX_INPUT_CHARS);
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: truncated,
      });

      return response.data[0]?.embedding ?? null;
    } catch (err) {
      console.error(
        '[Embedding] Failed to generate embedding:',
        (err as Error).message,
      );
      return null;
    }
  }

  /**
   * Generate embeddings for multiple texts in a single batch API call.
   * Returns null for any text that fails.
   */
  async generateBatchEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      console.warn(
        '[Embedding] OPENAI_API_KEY not set — skipping batch embedding generation',
      );
      return texts.map(() => null);
    }

    try {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey });

      const truncatedTexts = texts.map((t) => t.slice(0, MAX_INPUT_CHARS));
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: truncatedTexts,
      });

      // Response data is indexed by the input order
      const result: (number[] | null)[] = new Array<number[] | null>(
        texts.length,
      ).fill(null);
      for (const item of response.data) {
        result[item.index] = item.embedding;
      }
      return result;
    } catch (err) {
      console.error(
        '[Embedding] Failed to generate batch embeddings:',
        (err as Error).message,
      );
      return texts.map(() => null);
    }
  }
}
