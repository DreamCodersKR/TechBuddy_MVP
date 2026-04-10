import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DocumentModule } from '../document/document.module';
import { EmbeddingService } from './embedding.service';
import { EmbeddingPipelineService } from './embedding-pipeline.service';
import { RagService } from './rag.service';
import { TextExtractorService } from './text-extractor.service';

@Global()
@Module({
  imports: [PrismaModule, DocumentModule],
  providers: [
    EmbeddingService,
    EmbeddingPipelineService,
    RagService,
    TextExtractorService,
  ],
  exports: [EmbeddingPipelineService, RagService],
})
export class EmbeddingModule {}
