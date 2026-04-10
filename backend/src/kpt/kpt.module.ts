import { Module } from '@nestjs/common';
import { KptController } from './kpt.controller';
import { KptService } from './kpt.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KptController],
  providers: [KptService],
})
export class KptModule {}
