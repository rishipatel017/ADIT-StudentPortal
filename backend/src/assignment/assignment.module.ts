import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentController } from './assignment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ServicesModule } from '../services/services.module';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [PrismaModule, ServicesModule, NotificationModule],
  controllers: [AssignmentController],
  providers: [AssignmentService, PrismaService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
