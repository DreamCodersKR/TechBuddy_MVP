import { Module } from '@nestjs/common';
import { AgoraService } from './agora.service';
import { AgoraController } from './agora.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { XpModule } from '../xp/xp.module';
import { NotificationModule } from '../notification/notification.module';
import { QuestModule } from '../quest/quest.module';

@Module({
  imports: [PrismaModule, XpModule, NotificationModule, QuestModule],
  providers: [AgoraService],
  controllers: [AgoraController],
})
export class AgoraModule {}
