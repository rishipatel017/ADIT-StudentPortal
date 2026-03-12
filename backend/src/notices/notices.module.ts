import { Module } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { NoticesController } from './notices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ServicesModule } from '../services/services.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [NoticesController],
  providers: [NoticesService, PrismaService],
  imports: [PrismaModule, ServicesModule],
  exports: [NoticesService],
})
export class NoticesModule {}
