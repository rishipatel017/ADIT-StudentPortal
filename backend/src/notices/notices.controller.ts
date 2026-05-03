import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dtos/create-notice.dto';
import { UpdateNoticeDto } from './dtos/update-notice.dto';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}

import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('notices')
@UseGuards(JwtAuthGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/notices',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  async createNotice(
    @GetUser() user: any,
    @Body() createNoticeDto: CreateNoticeDto,
    @UploadedFile() file?: MulterFile,
  ) {
    if (user.role !== 'ADMIN' && user.role !== 'FACULTY') {
      throw new BadRequestException('Only admin and faculty can create notices');
    }

    return this.noticesService.createNotice(user.id, user.role, createNoticeDto, file);
  }

  @Get('student')
  async getStudentNotices(@GetUser() user: any) {
    if (user.role !== 'STUDENT') {
      throw new BadRequestException('Only students can view student notices');
    }

    return this.noticesService.getStudentNotices(user.id);
  }

  @Get('faculty')
  async getFacultyNotices(@GetUser() user: any) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can view faculty notices');
    }

    return this.noticesService.getFacultyNotices(user.id);
  }

  @Get('all')
  async getAllNotices(@GetUser() user: any) {
    if (user.role !== 'ADMIN' && user.role !== 'FACULTY') {
      throw new BadRequestException('Only admin and faculty can view all notices');
    }

    return this.noticesService.getAllNotices(user.id, user.role);
  }

  @Get('filter/target')
  async getNoticesByTarget(
    @Query('semester') semester?: number,
    @Query('divisionId') divisionId?: number,
    @Query('isForFaculty') isForFaculty?: boolean,
    @Query('isForStudents') isForStudents?: boolean,
  ) {
    return this.noticesService.getNoticesByTarget({
      semester,
      divisionId,
      isForFaculty,
      isForStudents,
    });
  }

  @Get('statistics')
  async getNoticeStatistics(@GetUser() user: any) {
    if (user.role !== 'ADMIN' && user.role !== 'FACULTY') {
      throw new BadRequestException('Only admin and faculty can view statistics');
    }

    return this.noticesService.getNoticeStatistics(user.id, user.role);
  }

  @Get(':id')
  async getNoticeById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ) {
    return this.noticesService.getNoticeById(id, user.id, user.role);
  }

  @Put(':id')
  async updateNotice(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
    @Body() updateNoticeDto: UpdateNoticeDto,
  ) {
    if (user.role !== 'ADMIN' && user.role !== 'FACULTY') {
      throw new BadRequestException('Only admin and faculty can update notices');
    }

    return this.noticesService.updateNotice(id, user.id, user.role, updateNoticeDto);
  }

  @Delete(':id')
  async deleteNotice(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: any,
  ) {
    if (user.role !== 'ADMIN' && user.role !== 'FACULTY') {
      throw new BadRequestException('Only admin and faculty can delete notices');
    }

    return this.noticesService.deleteNotice(id, user.id, user.role);
  }
}
