import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Prisma disconnected from database');
  }

  /**
   * Clean up helper for development/testing
   * WARNING: This will delete all data in the database
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => key[0] !== '_' && key !== 'constructor',
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Promise.all(
      models.map((modelKey) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const model = this[modelKey as string];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (model && typeof model.deleteMany === 'function') {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          return model.deleteMany();
        }
      }),
    );
  }
}
