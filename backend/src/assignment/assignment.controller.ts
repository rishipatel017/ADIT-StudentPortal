import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Query,
  Res,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dtos/create-assignment.dto';
import { SubmitAssignmentDto } from './dtos/submit-assignment.dto';
import { PrismaService } from '../prisma/prisma.service';

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

@Controller('assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentController {
  constructor(
    private readonly assignmentService: AssignmentService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveFacultyId(userId: number): Promise<number> {
    const faculty = await this.prisma.faculty.findFirst({ where: { userId, deletedAt: null } });
    if (!faculty) throw new BadRequestException('Faculty not found');
    return faculty.id;
  }

  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async createAssignment(
    @GetUser() user: any,
    @Body() createAssignmentDto: CreateAssignmentDto,
    @UploadedFile() file?: MulterFile,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can create assignments');
    }

    const facultyId = await this.resolveFacultyId(user.id);
    return this.assignmentService.createAssignment(facultyId, createAssignmentDto, file);
  }

  @Get('faculty')
  async getFacultyAssignments(
    @GetUser() user: any,
    @Query('semester') semester?: number,
    @Query('subjectId') subjectId?: number,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can view their assignments');
    }

    const facultyId = await this.resolveFacultyId(user.id);
    return this.assignmentService.getAssignmentsByFaculty(facultyId, semester, subjectId);
  }

  @Get('student')
  async getStudentAssignments(@GetUser() user: any) {
    if (user.role !== 'STUDENT') {
      throw new BadRequestException('Only students can view their assignments');
    }

    return this.assignmentService.getAssignmentsByStudent(user.id);
  }

  @Post(':assignmentId/submit')
  @UseInterceptors(FileInterceptor('file'))
  async submitAssignment(
    @GetUser() user: any,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Body() submitAssignmentDto: SubmitAssignmentDto,
    @UploadedFile() file: MulterFile,
  ) {
    if (user.role !== 'STUDENT') {
      throw new BadRequestException('Only students can submit assignments');
    }

    if (!file) {
      throw new BadRequestException('Assignment file is required');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new BadRequestException('File size must be less than 10MB');
    }

    return this.assignmentService.submitAssignment(user.id, assignmentId, submitAssignmentDto, file);
  }

  @Get(':assignmentId/submissions')
  async getAssignmentSubmissions(
    @GetUser() user: any,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Query('filter') filter?: string,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can view assignment submissions');
    }

    const facultyId = await this.resolveFacultyId(user.id);
    return this.assignmentService.getAssignmentSubmissions(assignmentId, facultyId, filter);
  }

  @Get('submissions/:submissionId/download')
  async downloadSubmission(
    @GetUser() user: any,
    @Param('submissionId', ParseIntPipe) submissionId: number,
    @Res() res: Response,
  ) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can download submissions');
    }

    const { filePath, originalName, student } = await this.assignmentService.downloadSubmission(submissionId);

    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Get(':assignmentId')
  async getAssignmentDetails(
    @GetUser() user: any,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    return this.assignmentService.getAssignmentDetails(assignmentId, user.id, user.role);
  }

  @Get(':assignmentId/attachment')
  async downloadAssignmentAttachment(
    @GetUser() user: any,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
    @Res() res: Response,
  ) {
    const { filePath, filename } = await this.assignmentService.downloadAssignmentAttachment(
      assignmentId,
      user.id,
      user.role,
    );

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);
  }
}
