import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [PrismaModule, TaskModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
