import { Module } from '@nestjs/common';
import { MarksService } from './marks.service';
import { MarksController } from './marks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ServicesModule } from '../services/services.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [MarksController],
  providers: [MarksService, PrismaService],
  imports: [PrismaModule, ServicesModule],
  exports: [MarksService],
})
export class MarksModule {}
