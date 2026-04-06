import { Module } from '@nestjs/common';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { R2Service } from './r2.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentController],
  providers: [DocumentService, R2Service],
})
export class DocumentModule {}
