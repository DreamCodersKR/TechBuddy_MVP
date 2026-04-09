import { Module } from '@nestjs/common';
import { CreditController } from './credit.controller';
import { CreditService } from './credit.service';
import { CreditSchedulerService } from './credit.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CreditController],
  providers: [CreditService, CreditSchedulerService],
  exports: [CreditSchedulerService],
})
export class CreditModule {}
