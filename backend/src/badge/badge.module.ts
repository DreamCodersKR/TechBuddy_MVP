import { Global, Module } from '@nestjs/common';
import { BadgeController } from './badge.controller';
import { BadgeService } from './badge.service';
import { PrismaModule } from '../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [BadgeController],
  providers: [BadgeService],
  exports: [BadgeService],
})
export class BadgeModule {}
