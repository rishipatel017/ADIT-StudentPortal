import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      console.log('Connecting to database...');
      await this.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed!');
      console.error(error);
      // In development, we might want to know why it's failing
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
