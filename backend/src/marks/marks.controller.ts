import {
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Query,
  Res,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { MarksService } from './marks.service';
import { CreateMarksUploadDto } from './dtos/create-marks-upload.dto';

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

@Controller('marks')
@UseGuards(JwtAuthGuard)
export class MarksController {
  constructor(private readonly marksService: MarksService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMarks(
    @GetUser() user: any,
    @Query('semester', ParseIntPipe) semester: number,
    @Query('subjectId', ParseIntPipe) subjectId: number,
    @Query('divisionId', ParseIntPipe) divisionId: number,
    @Body() createMarksUploadDto: CreateMarksUploadDto,
    @UploadedFile() file: MulterFile,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can upload marks');
    }

    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are allowed');
    }

    const result = await this.marksService.uploadMarks(user.id, createMarksUploadDto, file);

    if ('exists' in result) {
      return {
        exists: true,
        message: result.message,
        existingUpload: result.existingUpload,
      };
    }

    return result;
  }

  @Put('replace/:uploadId')
  @UseInterceptors(FileInterceptor('file'))
  async replaceMarks(
    @GetUser() user: any,
    @Param('uploadId', ParseIntPipe) uploadId: number,
    @UploadedFile() file: MulterFile,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can replace marks');
    }

    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    return this.marksService.replaceMarks(user.id, uploadId, file);
  }

  @Get('student')
  async getStudentMarks(
    @GetUser() user: any,
    @Query('semester') semester?: number,
  ) {
    if (user.role !== 'STUDENT') {
      throw new BadRequestException('Only students can view their marks');
    }

    return this.marksService.getStudentMarks(user.id, semester);
  }

  @Get('faculty')
  async getFacultyMarks(
    @GetUser() user: any,
    @Query('semester') semester?: number,
    @Query('subjectId') subjectId?: number,
    @Query('divisionId') divisionId?: number,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can view uploaded marks');
    }

    return this.marksService.getFacultyMarks(user.id, {
      semester,
      subjectId,
      divisionId,
    });
  }

  @Get('details/:uploadId')
  async getMarksDetails(
    @GetUser() user: any,
    @Param('uploadId', ParseIntPipe) uploadId: number,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can view marks details');
    }

    return this.marksService.getMarksDetails(uploadId, user.id);
  }

  @Get('export/:uploadId')
  async exportMarksCSV(
    @GetUser() user: any,
    @Param('uploadId', ParseIntPipe) uploadId: number,
    @Res() res: Response,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can export marks');
    }

    const csvData = await this.marksService.exportMarksCSV(uploadId, user.id);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="marks.csv"');
    res.send(csvData);
  }

  @Get('template')
  async downloadMarksTemplate(
    @GetUser() user: any,
    @Query('divisionId', ParseIntPipe) divisionId: number,
    @Res() res: Response,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can download template');
    }

    const csvData = await this.marksService.downloadMarksTemplate(divisionId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="marks_template.csv"');
    res.send(csvData);
  }

  @Get('statistics')
  async getMarksStatistics(
    @GetUser() user: any,
    @Query('subjectId') subjectId?: number,
    @Query('divisionId') divisionId?: number,
    @Query('semester') semester?: number,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can view marks statistics');
    }

    return this.marksService.getMarksStatistics(user.id, subjectId, divisionId, semester);
  }

  @Get('check-existing')
  async checkExistingMarks(
    @GetUser() user: any,
    @Query('semester', ParseIntPipe) semester: number,
    @Query('subjectId', ParseIntPipe) subjectId: number,
    @Query('divisionId', ParseIntPipe) divisionId: number,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can check existing marks');
    }

    const existingUpload = await this.marksService.checkExistingUpload(semester, subjectId, divisionId, user.id);
    return existingUpload;
  }
}
