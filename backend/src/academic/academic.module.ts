import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller';
import { AcademicCoreService } from './academic-core.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AcademicController],
  providers: [AcademicCoreService],
  exports: [AcademicCoreService],
})
export class AcademicModule { }
