import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicCoreService, AcademicContext, StudentContext } from '../academic/academic-core.service';
import { CreateMarksUploadDto } from './dtos/create-marks-upload.dto';
import * as fs from 'fs';
import * as path from 'path';

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

interface CSVRecord {
  enrollmentno?: string;
  enrollment?: string;
  marks?: string;
  [key: string]: string | undefined;
}

interface ValidatedMark {
  studentId: number;
  enrollment: string;
  marks: number;
}

import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MarksService {
  private readonly DEFAULT_MAX_MARKS = 20;
  private readonly PASSING_MARKS = 10; // 50% of DEFAULT_MAX_MARKS

  constructor(
    private prisma: PrismaService,
    private academicContext: AcademicCoreService,
    private notificationService: NotificationService
  ) {}

  async uploadMarks(
    facultyId: number, 
    createMarksUploadDto: CreateMarksUploadDto, 
    file: MulterFile
  ) {
    const { semester, subjectId, divisionId, overwrite } = createMarksUploadDto;
    
    // Load unified academic context for validation
    const context: AcademicContext = await this.academicContext.loadAcademicContext(
      semester,
      subjectId,
      divisionId,
      facultyId
    );

    // Validate faculty access
    const hasAccess = await this.academicContext.validateFacultyAccess(facultyId, subjectId, divisionId);
    if (!hasAccess) {
      throw new BadRequestException('Faculty not assigned to this subject-division combination');
    }
    
    // Check if marks already uploaded for this subject
    const existingUpload = await this.prisma.marksUpload.findFirst({
      where: {
        semesterId: semester,
        subjectId,
        divisionId,
      },
    });

    if (existingUpload && !overwrite) {
      return {
        exists: true,
        message: 'Marks already uploaded for this subject',
        existingUpload,
        context,
      };
    }

    // Parse and validate CSV file
    const marksData = await this.parseCSVFile(file);
    
    // Create student map from context for validation
    const studentMap = new Map(
      context.students.map(s => [s.enrollmentNo.toLowerCase(), s.id])
    );

    // Validate marks data
    const { validRecords, invalidRecords } = this.validateMarksData(
      marksData, 
      studentMap
    );

    if (validRecords.length === 0) {
      throw new BadRequestException('No valid records found in the CSV file');
    }

    // If overwrite is true and upload exists, delete existing marks
    if (existingUpload && overwrite) {
      await this.prisma.studentMarks.deleteMany({
        where: { uploadId: existingUpload.id },
      });
      
      // Update existing upload
      const updatedUpload = await this.prisma.marksUpload.update({
        where: { id: existingUpload.id },
        data: {
          maxMarks: this.DEFAULT_MAX_MARKS,
          uploadedAt: new Date(),
        },
      });

      // Insert new marks
      await this.insertStudentMarks(updatedUpload.id, validRecords);
      
      // Notify students of update
      await this.notificationService.createNotification({
        title: 'Marks Updated',
        message: `Marks for ${context.subject.name} have been updated.`,
        type: 'MARKS' as any,
        semesterId: semester,
        departmentId: context.semester.departmentId,
        divisionId: divisionId,
        isForStudents: true,
        isForFaculty: false,
      });

      return this.createUploadResponse(updatedUpload, validRecords, invalidRecords, context);
    }

    // Create new upload session
    const uploadSession = await this.prisma.marksUpload.create({
      data: {
        semesterId: semester,
        subjectId,
        divisionId,
        facultyId,
        maxMarks: this.DEFAULT_MAX_MARKS,
      },
    });

    // Insert student marks
    await this.insertStudentMarks(uploadSession.id, validRecords);

    // Notify students
    await this.notificationService.createNotification({
      title: 'Marks Uploaded',
      message: `Marks for ${context.subject.name} have been uploaded.`,
      type: 'MARKS' as any,
      semesterId: semester,
      departmentId: context.semester.departmentId,
      divisionId: divisionId,
      isForStudents: true,
      isForFaculty: false,
    });

    return this.createUploadResponse(uploadSession, validRecords, invalidRecords, context);
  }

  async replaceMarks(facultyId: number, uploadId: number, file: MulterFile) {
    // Verify faculty owns this upload
    const existingUpload = await this.getUploadById(uploadId, facultyId);
    
    if (!existingUpload) {
      throw new NotFoundException('Marks upload not found or access denied');
    }

    // Parse and process new CSV
    const csvData = await this.parseCSVFile(file);
    
    // Get students in the division
    const students = await this.prisma.student.findMany({
      where: { divisionId: existingUpload.divisionId },
      select: { id: true, enrollmentNo: true },
    });
    
    const studentMap = new Map(
      students.map(s => [s.enrollmentNo.toLowerCase(), s.id])
    );

    const { validRecords, invalidRecords } = this.validateMarksData(
      csvData, 
      studentMap
    );

    if (validRecords.length === 0) {
      throw new BadRequestException('No valid records found in the CSV file');
    }

    // Use transaction to ensure data consistency
    await this.prisma.$transaction(async (prisma) => {
      // Delete existing marks
      await prisma.studentMarks.deleteMany({
        where: { uploadId },
      });

      // Insert new marks
      await this.insertStudentMarks(uploadId, validRecords, prisma);
    });

    // Notify students
    const upload = await this.prisma.marksUpload.findUnique({
      where: { id: uploadId },
      include: { subject: true, semester: true },
    });

    if (upload) {
      await this.notificationService.createNotification({
        title: 'Marks Updated',
        message: `Marks for ${upload.subject.name} have been updated.`,
        type: 'MARKS' as any,
        semesterId: upload.semesterId,
        departmentId: upload.semester.departmentId,
        divisionId: upload.divisionId,
        isForStudents: true,
        isForFaculty: false,
      });
    }

    return {
      success: true,
      totalStudents: validRecords.length,
      invalidRecords: invalidRecords.length,
      message: 'Marks replaced successfully',
    };
  }

  async getStudentMarks(studentId: number, semester?: number) {
    // Load student context for unified data
    const studentContext: StudentContext = await this.academicContext.loadStudentContext(studentId);

    const whereClause: any = { 
      studentId,
      upload: semester ? { semesterId: semester } : {},
    };

    const marks = await this.prisma.studentMarks.findMany({
      where: whereClause,
      include: {
        upload: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        upload: {
          subject: {
            name: 'asc',
          },
        },
      },
    });

    return marks.map(mark => ({
      subject: mark.upload.subject.name,
      marksObtained: mark.marksObtained,
      maxMarks: mark.upload.maxMarks,
      semesterId: mark.upload.semesterId,
      uploadedAt: mark.upload.uploadedAt,
    }));
  }

  async getFacultyMarks(
    facultyId: number, 
    filters?: {
      semester?: number;
      subjectId?: number;
      divisionId?: number;
    }
  ) {
    const whereClause: any = { facultyId };
    
    if (filters?.semester) whereClause.semesterId = filters.semester;
    if (filters?.subjectId) whereClause.subjectId = filters.subjectId;
    if (filters?.divisionId) whereClause.divisionId = filters.divisionId;

    const uploads = await this.prisma.marksUpload.findMany({
      where: whereClause,
      include: {
        subject: true,
        division: true,
        marks: {
          include: {
            student: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return uploads.map(upload => ({
      ...upload,
      totalStudents: upload.marks.length,
      averageMarks: this.calculateAverage(upload.marks),
      highestMarks: Math.max(...upload.marks.map(m => m.marksObtained), 0),
      lowestMarks: Math.min(...upload.marks.map(m => m.marksObtained), 0),
    }));
  }

  async getMarksDetails(uploadId: number, facultyId: number) {
    const upload = await this.prisma.marksUpload.findFirst({
      where: {
        id: uploadId,
        facultyId,
      },
      include: {
        subject: true,
        division: true,
        marks: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!upload) {
      throw new NotFoundException('Marks upload not found or access denied');
    }

    return {
      ...upload,
      marks: upload.marks
        .map(mark => ({
          ...mark,
          student: {
            enrollmentNo: mark.student.enrollmentNo,
            name: mark.student.name,
          },
        }))
        .sort((a, b) => a.student.enrollmentNo.localeCompare(b.student.enrollmentNo)),
    };
  }

  async exportMarksCSV(uploadId: number, facultyId: number): Promise<string> {
    const upload = await this.getMarksDetails(uploadId, facultyId);

    const csvRows = ['Enrollment,Student Name,Marks'];
    
    upload.marks.forEach(mark => {
      csvRows.push(`${mark.student.enrollmentNo},${mark.student.name},${mark.marksObtained}`);
    });

    return csvRows.join('\n');
  }

  async downloadMarksTemplate(divisionId: number): Promise<string> {
    const students = await this.prisma.student.findMany({
      where: { divisionId },
      select: {
        enrollmentNo: true,
        name: true,
      },
      orderBy: {
        enrollmentNo: 'asc',
      },
    });

    const csvRows = ['Enrollment,Student Name,Marks'];
    
    students.forEach(student => {
      csvRows.push(`${student.enrollmentNo},${student.name},`);
    });

    return csvRows.join('\n');
  }

  async getMarksStatistics(
    facultyId: number, 
    subjectId?: number, 
    divisionId?: number, 
    semester?: number
  ) {
    const whereClause: any = { facultyId };
    if (subjectId) whereClause.subjectId = subjectId;
    if (divisionId) whereClause.divisionId = divisionId;
    if (semester) whereClause.semesterId = semester;

    const uploads = await this.prisma.marksUpload.findMany({
      where: whereClause,
      include: {
        marks: true,
        subject: true,
      },
    });

    return uploads.map(upload => {
      const marks = upload.marks;
      const totalStudents = marks.length;
      const passCount = marks.filter(m => m.marksObtained >= this.PASSING_MARKS).length;
      
      return {
        subject: upload.subject.name,
        semesterId: upload.semesterId,
        totalStudents,
        averageMarks: this.calculateAverage(marks),
        highestMarks: Math.max(...marks.map(m => m.marksObtained), 0),
        lowestMarks: Math.min(...marks.map(m => m.marksObtained), 0),
        passCount,
        passPercentage: totalStudents > 0 
          ? Math.round((passCount / totalStudents) * 100) 
          : 0,
      };
    });
  }

  async getUploadById(uploadId: number, facultyId: number) {
    return this.prisma.marksUpload.findFirst({
      where: {
        id: uploadId,
        facultyId,
      },
      include: {
        subject: true,
        division: true,
        marks: true,
      },
    });
  }

  async checkExistingUpload(
    semester: number, 
    subjectId: number, 
    divisionId: number, 
    facultyId: number
  ) {
    return this.prisma.marksUpload.findFirst({
      where: {
        semesterId: semester,
        subjectId,
        divisionId,
        facultyId,
      },
      include: {
        subject: true,
        division: true,
        marks: true,
      },
    });
  }

  private async parseCSVFile(file: MulterFile): Promise<CSVRecord[]> {
    try {
      const csvData = fs.readFileSync(file.path, 'utf8');
      const lines = csvData.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new BadRequestException('CSV file must contain header and data rows');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const records: CSVRecord[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 2) {
          const record: CSVRecord = {};
          headers.forEach((header, index) => {
            if (index < values.length) {
              record[header] = values[index];
            }
          });
          records.push(record);
        }
      }

      // Clean up the uploaded file
      fs.unlinkSync(file.path);
      
      return records;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to parse CSV file');
    }
  }

  private validateMarksData(
    records: CSVRecord[], 
    studentMap: Map<string, number>
  ): { validRecords: ValidatedMark[]; invalidRecords: any[] } {
    const validRecords: ValidatedMark[] = [];
    const invalidRecords: any[] = [];

    for (const record of records) {
      const enrollment = (record.enrollmentno || record.enrollment || '').toString().trim();
      const marksStr = (record.marks || '').toString().trim();

      // Check required fields
      if (!enrollment) {
        invalidRecords.push({ record, error: 'Enrollment number is required' });
        continue;
      }

      if (!marksStr) {
        invalidRecords.push({ record, error: 'Marks are required' });
        continue;
      }

      // Validate marks format
      const marks = parseFloat(marksStr);
      if (isNaN(marks)) {
        invalidRecords.push({ record, error: 'Marks must be a valid number' });
        continue;
      }

      // Validate marks range
      if (marks < 0 || marks > this.DEFAULT_MAX_MARKS) {
        invalidRecords.push({ 
          record, 
          error: `Marks must be between 0 and ${this.DEFAULT_MAX_MARKS}` 
        });
        continue;
      }

      // Check if student exists
      const studentId = studentMap.get(enrollment.toLowerCase());
      if (!studentId) {
        invalidRecords.push({ record, error: 'Student not found in division' });
        continue;
      }

      validRecords.push({
        studentId,
        enrollment,
        marks,
      });
    }

    return { validRecords, invalidRecords };
  }

  private async insertStudentMarks(
    uploadId: number, 
    records: ValidatedMark[],
    prisma?: any
  ) {
    const data = records.map(record => ({
      uploadId,
      studentId: record.studentId,
      marksObtained: record.marks,
    }));

    const prismaClient = prisma || this.prisma;
    
    await prismaClient.studentMarks.createMany({
      data,
    });
  }

  private createUploadResponse(
    uploadSession: any,
    validRecords: ValidatedMark[],
    invalidRecords: any[],
    context?: AcademicContext
  ) {
    return {
      success: true,
      uploadSession,
      context,
      totalStudents: validRecords.length,
      invalidRecords: invalidRecords.length,
      invalidDetails: invalidRecords.length > 0 ? invalidRecords : undefined,
      message: 'Marks uploaded successfully',
    };
  }

  private calculateAverage(marks: any[]): number {
    if (marks.length === 0) return 0;
    const sum = marks.reduce((acc, mark) => acc + mark.marksObtained, 0);
    return Math.round((sum / marks.length) * 100) / 100;
  }
}