import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dtos/create-attendance.dto';
import { UpdateAttendanceDto } from './dtos/update-attendance.dto';
import { PrismaService } from '../prisma/prisma.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveFacultyId(userId: number): Promise<number> {
    const faculty = await this.prisma.faculty.findFirst({ where: { userId, deletedAt: null } });
    if (!faculty) throw new BadRequestException('Faculty not found');
    return faculty.id;
  }

  @Post('create')
  async createAttendance(
    @GetUser() user: any,
    @Body() createAttendanceDto: CreateAttendanceDto,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can create attendance');
    }

    const facultyId = await this.resolveFacultyId(user.id);
    return this.attendanceService.createAttendance(facultyId, createAttendanceDto);
  }

  @Get('history')
  async getAttendanceHistory(
    @GetUser() user: any,
    @Query('semester') semester?: number,
    @Query('subjectId') subjectId?: number,
    @Query('divisionId') divisionId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can view attendance history');
    }

    const facultyId = await this.resolveFacultyId(user.id);
    return this.attendanceService.getAttendanceHistory(facultyId, {
      semester,
      subjectId,
      divisionId,
      startDate,
      endDate,
    });
  }

  @Get('students')
  async getStudentsForAttendance(
    @Query('semester', ParseIntPipe) semester: number,
    @Query('subjectId', ParseIntPipe) subjectId: number,
    @Query('divisionId', ParseIntPipe) divisionId: number,
    @GetUser() user: any,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can view student list');
    }

    return this.attendanceService.getStudentsForAttendance(semester, subjectId, divisionId);
  }

  @Get('session/:sessionId')
  async getAttendanceSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @GetUser() user: any,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can view attendance sessions');
    }

    return this.attendanceService.getAttendanceSession(sessionId);
  }

  @Put('session/:sessionId')
  async updateAttendance(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @GetUser() user: any,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can update attendance');
    }

    const facultyId = await this.resolveFacultyId(user.id);
    return this.attendanceService.updateAttendance(sessionId, facultyId, updateAttendanceDto);
  }

  @Delete('session/:sessionId')
  async deleteAttendanceSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @GetUser() user: any,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can delete attendance sessions');
    }

    const facultyId = await this.resolveFacultyId(user.id);
    return this.attendanceService.deleteAttendanceSession(sessionId, facultyId);
  }

  @Get('export/csv')
  async exportAttendanceCSV(
    @Query('subjectId', ParseIntPipe) subjectId: number,
    @Query('divisionId', ParseIntPipe) divisionId: number,
    @Query('semester', ParseIntPipe) semester: number,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can export attendance');
    }

    const csvData = await this.attendanceService.exportAttendanceCSV(subjectId, divisionId, semester);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    res.send(csvData);
  }

  @Get('statistics')
  async getAttendanceStatistics(
    @GetUser() user: any,
    @Query('subjectId') subjectId?: number,
    @Query('divisionId') divisionId?: number,
    @Query('semester') semester?: number,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can view attendance statistics');
    }

    const facultyId = await this.resolveFacultyId(user.id);
    return this.attendanceService.getAttendanceStatistics(facultyId, subjectId, divisionId, semester);
  }

  @Get('student')
  async getStudentAttendance(
    @GetUser() user: any,
    @Query('semester') semester?: number,
  ) {
    if (user.role !== 'STUDENT') {
      throw new BadRequestException('Only students can view their attendance');
    }

    return this.attendanceService.getStudentAttendance(user.id, semester);
  }

  @Get('check-duplicate')
  async checkDuplicateAttendance(
    @Query('subjectId', ParseIntPipe) subjectId: number,
    @Query('divisionId', ParseIntPipe) divisionId: number,
    @Query('lectureDate') lectureDate: string,
    @Query('lectureNo', ParseIntPipe) lectureNo: number,
    @GetUser() user: any,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can check duplicate attendance');
    }

    const existingSession = await this.attendanceService.prismaClient.attendanceSession.findFirst({
      where: {
        subjectId,
        divisionId,
        lectureDate: new Date(lectureDate),
        lectureNo,
      },
    });

    return {
      exists: !!existingSession,
      session: existingSession,
    };
  }
}
