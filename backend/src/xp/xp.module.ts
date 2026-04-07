import { Module } from '@nestjs/common';
import { XpService } from './xp.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [XpService],
  exports: [XpService],
})
export class XpModule {}
