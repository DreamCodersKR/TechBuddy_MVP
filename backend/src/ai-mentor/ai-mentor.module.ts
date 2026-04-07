import { Module } from '@nestjs/common';
import { AiMentorService } from './ai-mentor.service';
import { AiMentorController } from './ai-mentor.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QuestModule } from '../quest/quest.module';

@Module({
  imports: [PrismaModule, QuestModule],
  providers: [AiMentorService],
  controllers: [AiMentorController],
})
export class AiMentorModule {}
