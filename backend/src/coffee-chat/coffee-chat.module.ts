import { Module } from '@nestjs/common';
import { CoffeeChatController } from './coffee-chat.controller';
import { CoffeeChatService } from './coffee-chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [CoffeeChatController],
  providers: [CoffeeChatService],
})
export class CoffeeChatModule {}
