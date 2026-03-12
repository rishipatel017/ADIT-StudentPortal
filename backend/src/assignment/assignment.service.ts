import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicCoreService, AcademicContext, StudentContext } from '../academic/academic-core.service';
import { CreateAssignmentDto } from './dtos/create-assignment.dto';
import { SubmitAssignmentDto } from './dtos/submit-assignment.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

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

@Injectable()
export class AssignmentService {
  constructor(
    private prisma: PrismaService,
    private academicContext: AcademicCoreService
  ) {}

  async createAssignment(facultyId: number, createAssignmentDto: CreateAssignmentDto, file?: MulterFile) {
    const { title, description, semester, subjectId, divisionIds, dueDate } = createAssignmentDto;

    // Load unified academic context for validation
    const context = await this.academicContext.loadAcademicContext(semester, subjectId, divisionIds[0]);

    // Validate faculty access to at least one division
    const hasAccess = await this.academicContext.validateFacultyAccess(facultyId, subjectId, divisionIds[0]);
    if (!hasAccess) {
      throw new BadRequestException('Faculty not assigned to this subject-division combination');
    }

    // Create assignment
    const assignment = await this.prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        semesterId: semester,
        subjectId,
        facultyId,
        attachment: file ? `uploads/assignments/${file.filename}` : null,
      },
    });

    // Link assignment to divisions
    const assignmentDivisions = await this.prisma.assignmentDivision.createMany({
      data: divisionIds.map(divisionId => ({
        assignmentId: assignment.id,
        divisionId,
      })),
    });

    return {
      ...assignment,
      context,
      divisions: assignmentDivisions,
      totalStudents: context.students.length,
    };
  }

  async getAssignmentsByFaculty(facultyId: number, semester?: number, subjectId?: number) {
    const whereClause: any = { facultyId };
    
    if (semester) {
      whereClause.semesterId = semester as any;
    }
    if (subjectId) whereClause.subjectId = subjectId;

    const assignments = await this.prisma.assignment.findMany({
      where: whereClause,
      include: {
        subject: {
          include: {
            semester: true
          }
        },
        divisions: {
          include: {
            division: true
          }
        },
        submissions: {
          include: {
            student: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return assignments.map(assignment => ({
      ...assignment,
      totalStudents: this.calculateTotalStudents(assignment.divisions),
      submittedCount: assignment.submissions.length,
      pendingCount: this.calculateTotalStudents(assignment.divisions) - assignment.submissions.length,
    }));
  }

  async getAssignmentsByStudent(studentId: number) {
    // Load student context for unified data
    const studentContext: StudentContext = await this.academicContext.loadStudentContext(studentId);

    const assignments = await this.prisma.assignment.findMany({
      where: {
        semesterId: studentContext.semester.id,
        divisions: {
          some: {
            divisionId: studentContext.division.id
          }
        }
      },
      include: {
        subject: true,
        faculty: true,
        divisions: {
          include: {
            division: true
          }
        },
        submissions: {
          where: {
            studentId: studentId
          },
          include: {
            student: true
          }
        }
      }
    });

    return assignments.map(assignment => {
      const submission = assignment.submissions[0];
      const status = this.getAssignmentStatus(assignment.dueDate, submission?.submittedAt);
      
      return {
        ...assignment,
        status,
        submission: submission || null,
      };
    });
  }

  async submitAssignment(studentId: number, assignmentId: number, submitAssignmentDto: SubmitAssignmentDto, file: MulterFile) {
    // Verify assignment exists and student can submit
    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        divisions: {
          some: {
            division: {
              students: {
                some: {
                  id: studentId
                }
              }
            }
          }
        }
      },
      include: {
        divisions: {
          include: {
            division: {
              include: {
                students: true
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      throw new Error('Assignment not found or access denied');
    }

    // Check if already submitted
    const existingSubmission = await this.prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId
        }
      }
    });

    if (existingSubmission) {
      throw new Error('Assignment already submitted');
    }

    // Compress file before storing
    const compressedFilePath = await this.compressFile(file);

    // Create submission record
    const submission = await this.prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        filePath: compressedFilePath,
        originalName: file.originalname,
        fileSize: file.size,
        compressed: true,
      }
    });

    return submission;
  }

  async getAssignmentSubmissions(assignmentId: number, facultyId: number, filter?: string) {
    // Verify faculty owns this assignment
    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        facultyId
      },
      include: {
        divisions: {
          include: {
            division: {
              include: {
                students: true
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      throw new Error('Assignment not found or access denied');
    }

    // Get all students from assigned divisions
    const allStudents = assignment.divisions.flatMap(d => d.division.students);

    // Get submissions
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: {
        assignmentId
      },
      include: {
        student: true
      }
    });

    // Apply filters
    let filteredStudents = allStudents;

    if (filter === 'submitted') {
      const submittedStudentIds = submissions.map(s => s.studentId);
      filteredStudents = allStudents.filter(s => submittedStudentIds.includes(s.id));
    } else if (filter === 'pending') {
      const submittedStudentIds = submissions.map(s => s.studentId);
      filteredStudents = allStudents.filter(s => !submittedStudentIds.includes(s.id));
    } else if (filter === 'late') {
      filteredStudents = submissions
        .filter(s => new Date(s.submittedAt) > new Date(assignment.dueDate))
        .map(s => s.student);
    }

    return {
      assignment: {
        ...assignment,
        totalStudents: allStudents.length,
        submittedCount: submissions.length,
        pendingCount: allStudents.length - submissions.length,
        lateCount: submissions.filter(s => new Date(s.submittedAt) > new Date(assignment.dueDate)).length,
      },
      students: filteredStudents.map(student => {
        const submission = submissions.find(s => s.studentId === student.id);
        return {
          ...student,
          submission: submission || null,
          status: this.getSubmissionStatus(assignment.dueDate, submission?.submittedAt),
        };
      })
    };
  }

  async downloadSubmission(submissionId: number, studentId?: number) {
    const submission = await this.prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: true,
        assignment: true
      }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    const filePath = path.join(process.cwd(), submission.filePath);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    return {
      filePath,
      originalName: submission.originalName,
      student: submission.student,
      assignment: submission.assignment
    };
  }

  private async compressFile(file: MulterFile): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'submissions');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const originalPath = file.path;
    const compressedPath = path.join(uploadsDir, `compressed_${file.filename}`);

    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(originalPath);
      const writeStream = fs.createWriteStream(compressedPath);
      const gzip = zlib.createGzip();

      readStream
        .pipe(gzip)
        .pipe(writeStream)
        .on('finish', () => {
          // Remove original file after compression
          fs.unlinkSync(originalPath);
          resolve(`uploads/submissions/compressed_${file.filename}`);
        })
        .on('error', reject);
    });
  }

  private calculateTotalStudents(divisions: any[]): number {
    return divisions.reduce((total, d) => total + (d.division?.students?.length || 0), 0);
  }

  private getAssignmentStatus(dueDate: Date, submittedAt?: Date): string {
    if (!submittedAt) {
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) return 'OVERDUE';
      if (daysUntilDue <= 3) return 'DUE_SOON';
      return 'PENDING';
    }

    if (new Date(submittedAt) > new Date(dueDate)) {
      return 'SUBMITTED_LATE';
    }

    return 'SUBMITTED';
  }

  private getSubmissionStatus(dueDate: Date, submittedAt?: Date): string {
    if (!submittedAt) return 'PENDING';
    
    if (new Date(submittedAt) > new Date(dueDate)) {
      return 'LATE';
    }
    
    return 'SUBMITTED';
  }

  async getAssignmentDetails(assignmentId: number, userId: number, userRole: string) {
    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        facultyId: userRole === 'FACULTY' ? userId : undefined
      },
      include: {
        subject: true,
        faculty: true,
        divisions: {
          include: {
            division: true
          }
        }
      }
    });

    if (!assignment) {
      throw new Error('Assignment not found or access denied');
    }

    // Check if user has access to this assignment
    if (userRole === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { id: userId },
        include: { division: true }
      });

      const hasAccess = assignment.divisions.some(d => d.divisionId === student?.divisionId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      // Include student's submission if any
      const submission = await this.prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_studentId: {
            assignmentId,
            studentId: userId
          }
        }
      });

      return {
        ...assignment,
        submission: submission || null
      };
    }

    return assignment;
  }

  async downloadAssignmentAttachment(assignmentId: number, userId: number, userRole: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        divisions: true,
      }
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (!assignment.attachment) {
      throw new NotFoundException('Assignment attachment not found');
    }

    if (userRole === 'STUDENT') {
      const student = await this.prisma.student.findUnique({
        where: { id: userId },
        select: { divisionId: true },
      });

      const hasAccess = assignment.divisions.some(d => d.divisionId === student?.divisionId);
      if (!hasAccess) {
        throw new BadRequestException('Access denied');
      }
    }

    if (userRole === 'FACULTY' && assignment.facultyId !== userId) {
      throw new BadRequestException('Access denied');
    }

    const resolvedPath = path.join(process.cwd(), assignment.attachment);
    if (!fs.existsSync(resolvedPath)) {
      throw new NotFoundException('File not found');
    }

    return {
      filePath: resolvedPath,
      filename: path.basename(assignment.attachment),
    };
  }
}
