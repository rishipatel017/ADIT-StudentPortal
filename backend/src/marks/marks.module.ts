import { Module } from '@nestjs/common';
import { MarksService } from './marks.service';
import { MarksController } from './marks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ServicesModule } from '../services/services.module';
import { PrismaService } from '../prisma/prisma.service';

import { NotificationModule } from '../notification/notification.module';

@Module({
  controllers: [MarksController],
  providers: [MarksService, PrismaService],
  imports: [PrismaModule, ServicesModule, NotificationModule],
  exports: [MarksService],
})
export class MarksModule {}
