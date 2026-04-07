import { Module } from '@nestjs/common';
import { TilController } from './til.controller';
import { TilService } from './til.service';
import { PrismaModule } from '../prisma/prisma.module';
import { XpModule } from '../xp/xp.module';
import { QuestModule } from '../quest/quest.module';

@Module({
  imports: [PrismaModule, XpModule, QuestModule],
  controllers: [TilController],
  providers: [TilService],
  exports: [TilService],
})
export class TilModule {}
