import { Module } from '@nestjs/common';
import { AiMentorService } from './ai-mentor.service';
import { AiMentorController } from './ai-mentor.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AiMentorService],
  controllers: [AiMentorController],
})
export class AiMentorModule {}
