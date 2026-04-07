import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { XpModule } from '../xp/xp.module';
import { NotificationModule } from '../notification/notification.module';
import { QuestModule } from '../quest/quest.module';

@Module({
  imports: [PrismaModule, XpModule, NotificationModule, QuestModule],
  providers: [CommentService],
  controllers: [CommentController],
})
export class CommentModule {}
