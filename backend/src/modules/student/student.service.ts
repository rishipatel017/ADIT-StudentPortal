import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Student } from '@prisma/client';

export interface CreateStudentData {
  enrollmentNo: string;
  name: string;
  email: string;
  departmentId: number;
  divisionId: number;
  semesterId: number;
  userId: number;
}

export interface UpdateStudentData {
  enrollmentNo?: string;
  name?: string;
  email?: string;
  departmentId?: number;
  divisionId?: number;
  semesterId?: number;
  userId?: number;
  deletedAt?: Date;
}

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateStudentData): Promise<Student> {
    // Validate related entities exist
    const [department, division, semester, user] = await Promise.all([
      this.prisma.department.findUnique({ where: { id: data.departmentId } }),
      this.prisma.division.findUnique({ where: { id: data.divisionId } }),
      this.prisma.semester.findUnique({ where: { id: data.semesterId } }),
      this.prisma.user.findUnique({ where: { id: data.userId } })
    ]);

    if (!department) {
      throw new NotFoundException(`Department with ID ${data.departmentId} not found`);
    }
    if (!division) {
      throw new NotFoundException(`Division with ID ${data.divisionId} not found`);
    }
    if (!semester) {
      throw new NotFoundException(`Semester with ID ${data.semesterId} not found`);
    }
    if (!user) {
      throw new NotFoundException(`User with ID ${data.userId} not found`);
    }

    // Check if enrollment number already exists
    const existingStudent = await this.prisma.student.findUnique({
      where: { enrollmentNo: data.enrollmentNo }
    });

    if (existingStudent) {
      throw new BadRequestException(`Student with enrollment number ${data.enrollmentNo} already exists`);
    }

    // Check if user is already linked to a student
    const existingUserStudent = await this.prisma.student.findUnique({
      where: { userId: data.userId }
    });

    if (existingUserStudent) {
      throw new BadRequestException(`User with ID ${data.userId} is already linked to a student`);
    }

    return this.prisma.student.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            lastLogin: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        division: {
          select: {
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            number: true
          }
        },
        _count: {
          select: {
            submissions: true,
            attendanceRecords: true,
            marks: true
          }
        }
      }
    });
  }

  async findAll(includeDeleted: boolean = false): Promise<Student[]> {
    return this.prisma.student.findMany({
      where: {
        deletedAt: includeDeleted ? undefined : null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            lastLogin: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        division: {
          select: {
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            number: true
          }
        },
        _count: {
          select: {
            submissions: true,
            attendanceRecords: true,
            marks: true
          }
        }
      },
      orderBy: {
        enrollmentNo: 'asc'
      }
    });
  }

  async findOne(id: number): Promise<Student> {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            lastLogin: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        division: {
          select: {
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            number: true
          }
        },
        submissions: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                dueDate: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                }
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        },
        attendanceRecords: {
          include: {
            session: {
              select: {
                id: true,
                lectureNo: true,
                topic: true,
                lectureDate: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                }
              }
            }
          },
          orderBy: {
            session: {
              lectureDate: 'desc'
            }
          }
        },
        marks: {
          include: {
            upload: {
              select: {
                id: true,
                maxMarks: true,
                uploadedAt: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                },
                division: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            upload: {
              uploadedAt: 'desc'
            }
          }
        },
        _count: {
          select: {
            submissions: true,
            attendanceRecords: true,
            marks: true
          }
        }
      }
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    return student;
  }

  async update(id: number, data: UpdateStudentData): Promise<Student> {
    // Check if student exists
    await this.findOne(id);

    // Validate related entities if provided
    if (data.departmentId) {
      const department = await this.prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!department) {
        throw new NotFoundException(`Department with ID ${data.departmentId} not found`);
      }
    }

    if (data.divisionId) {
      const division = await this.prisma.division.findUnique({ where: { id: data.divisionId } });
      if (!division) {
        throw new NotFoundException(`Division with ID ${data.divisionId} not found`);
      }
    }

    if (data.semesterId) {
      const semester = await this.prisma.semester.findUnique({ where: { id: data.semesterId } });
      if (!semester) {
        throw new NotFoundException(`Semester with ID ${data.semesterId} not found`);
      }
    }

    if (data.userId) {
      const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${data.userId} not found`);
      }

      // Check if user is already linked to another student
      const existingUserStudent = await this.prisma.student.findFirst({
        where: {
          userId: data.userId,
          id: { not: id }
        }
      });

      if (existingUserStudent) {
        throw new BadRequestException(`User with ID ${data.userId} is already linked to another student`);
      }
    }

    // If updating enrollment number, check for conflicts
    if (data.enrollmentNo) {
      const existingStudent = await this.prisma.student.findFirst({
        where: {
          enrollmentNo: data.enrollmentNo,
          id: { not: id }
        }
      });

      if (existingStudent) {
        throw new BadRequestException(`Enrollment number ${data.enrollmentNo} is already taken`);
      }
    }

    return this.prisma.student.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            lastLogin: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        division: {
          select: {
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            number: true
          }
        },
        _count: {
          select: {
            submissions: true,
            attendanceRecords: true,
            marks: true
          }
        }
      }
    });
  }

  async softDelete(id: number): Promise<Student> {
    await this.findOne(id);

    return this.prisma.student.update({
      where: { id },
      data: {
        deletedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        division: {
          select: {
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            number: true
          }
        }
      }
    });
  }

  async restore(id: number): Promise<Student> {
    const student = await this.prisma.student.findFirst({
      where: {
        id,
        deletedAt: { not: null }
      }
    });

    if (!student) {
      throw new NotFoundException(`Deleted student with ID ${id} not found`);
    }

    return this.prisma.student.update({
      where: { id },
      data: {
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        division: {
          select: {
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            number: true
          }
        }
      }
    });
  }

  async remove(id: number): Promise<Student> {
    await this.findOne(id);

    return this.prisma.student.delete({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        division: {
          select: {
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            number: true
          }
        }
      }
    });
  }

  async findByEnrollmentNo(enrollmentNo: string): Promise<Student> {
    const student = await this.prisma.student.findUnique({
      where: { enrollmentNo },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            lastLogin: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        division: {
          select: {
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            number: true
          }
        },
        _count: {
          select: {
            submissions: true,
            attendanceRecords: true,
            marks: true
          }
        }
      }
    });

    if (!student) {
      throw new NotFoundException(`Student with enrollment number ${enrollmentNo} not found`);
    }

    return student;
  }

  async findByDepartment(departmentId: number): Promise<Student[]> {
    return this.prisma.student.findMany({
      where: {
        departmentId,
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            lastLogin: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        division: {
          select: {
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            number: true
          }
        },
        _count: {
          select: {
            submissions: true,
            attendanceRecords: true,
            marks: true
          }
        }
      },
      orderBy: {
        enrollmentNo: 'asc'
      }
    });
  }

  async findByDivision(divisionId: number): Promise<Student[]> {
    return this.prisma.student.findMany({
      where: {
        divisionId,
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            lastLogin: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        division: {
          select: {
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            number: true
          }
        },
        _count: {
          select: {
            submissions: true,
            attendanceRecords: true,
            marks: true
          }
        }
      },
      orderBy: {
        enrollmentNo: 'asc'
      }
    });
  }

  async findBySemester(semesterId: number): Promise<Student[]> {
    return this.prisma.student.findMany({
      where: {
        semesterId,
        deletedAt: null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            lastLogin: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        division: {
          select: {
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            number: true
          }
        },
        _count: {
          select: {
            submissions: true,
            attendanceRecords: true,
            marks: true
          }
        }
      },
      orderBy: {
        enrollmentNo: 'asc'
      }
    });
  }

  async getStudentStats(id: number): Promise<{
    totalAssignments: number;
    submittedAssignments: number;
    pendingAssignments: number;
    totalAttendanceSessions: number;
    presentSessions: number;
    attendancePercentage: number;
    totalMarksUploads: number;
    averageMarks: number;
    latestGPA: number;
  }> {
    const student = await this.findOne(id);

    const [
      submittedAssignments,
      pendingAssignments,
      presentSessions,
      totalAttendanceSessions,
      marksData
    ] = await Promise.all([
      this.prisma.assignmentSubmission.count({
        where: {
          studentId: id
        }
      }),
      this.prisma.assignment.count({
        where: {
          deletedAt: null,
          dueDate: {
            gt: new Date()
          },
          NOT: {
            submissions: {
              some: {
                studentId: id
              }
            }
          }
        }
      }),
      this.prisma.attendanceRecord.count({
        where: {
          studentId: id,
          status: true
        }
      }),
      this.prisma.attendanceRecord.count({
        where: {
          studentId: id
        }
      }),
      this.prisma.studentMarks.findMany({
        where: {
          studentId: id
        },
        include: {
          upload: {
            select: {
              maxMarks: true,
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  credits: true
                }
              }
            }
          }
        }
      })
    ]);

    const attendancePercentage = totalAttendanceSessions > 0 
      ? (presentSessions / totalAttendanceSessions) * 100 
      : 0;

    // Calculate average marks and GPA
    let totalMarks = 0;
    let totalMaxMarks = 0;
    let totalCredits = 0;
    let totalGradePoints = 0;

    const subjectMarks = new Map<number, { obtained: number; max: number; credits: number }>();

    marksData.forEach(mark => {
      const subjectId = mark.upload.subject.id;
      const credits = mark.upload.subject.credits;
      
      if (!subjectMarks.has(subjectId)) {
        subjectMarks.set(subjectId, { obtained: 0, max: 0, credits });
      }
      
      const subjectData = subjectMarks.get(subjectId)!;
      subjectData.obtained += mark.marksObtained;
      subjectData.max += mark.upload.maxMarks;
    });

    subjectMarks.forEach(({ obtained, max, credits }) => {
      totalMarks += obtained;
      totalMaxMarks += max;
      totalCredits += credits;
      
      const percentage = max > 0 ? (obtained / max) * 100 : 0;
      const gradePoint = this.calculateGradePoint(percentage);
      totalGradePoints += gradePoint * credits;
    });

    const averageMarks = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    const latestGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;

    return {
      totalAssignments: submittedAssignments,
      submittedAssignments,
      pendingAssignments,
      totalAttendanceSessions,
      presentSessions,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100,
      totalMarksUploads: marksData.length,
      averageMarks: Math.round(averageMarks * 100) / 100,
      latestGPA: Math.round(latestGPA * 100) / 100
    };
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  }

  private calculateGradePoint(percentage: number): number {
    if (percentage >= 90) return 10.0;
    if (percentage >= 80) return 9.0;
    if (percentage >= 70) return 8.0;
    if (percentage >= 60) return 7.0;
    if (percentage >= 50) return 6.0;
    if (percentage >= 40) return 5.0;
    return 0.0;
  }

  async getStudentsWithPerformanceData(divisionId?: number, semesterId?: number): Promise<any[]> {
    const whereClause: any = {
      deletedAt: null
    };

    if (divisionId) whereClause.divisionId = divisionId;
    if (semesterId) whereClause.semesterId = semesterId;

    return this.prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            lastLogin: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        division: {
          select: {
            id: true,
            name: true
          }
        },
        semester: {
          select: {
            id: true,
            number: true
          }
        },
        _count: {
          select: {
            submissions: true,
            attendanceRecords: true,
            marks: true
          }
        }
      },
      orderBy: {
        enrollmentNo: 'asc'
      }
    });
  }

  async getStudentAssignments(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        semester: true,
        division: true,
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.assignment.findMany({
      where: {
        semesterId: student.semesterId,
        subject: {
          semester: {
            divisions: {
              some: {
                id: student.divisionId,
              },
            },
          },
        },
      },
      include: {
        subject: true,
        faculty: true,
        submissions: {
          where: { studentId: student.id },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getStudentNotices(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.notice.findMany({
      where: {
        semesterId: student.semesterId,
        OR: [
          { divisionId: null },
          { divisionId: student.divisionId },
        ],
        isForStudents: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudentAttendance(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.attendanceRecord.findMany({
      where: { studentId: student.id },
      include: {
        session: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        session: {
          lectureDate: 'desc',
        },
      },
    });
  }

  async getStudentMarks(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) throw new NotFoundException('Student not found');

    // Scope to the student's own division and semester to avoid duplicate
    // rows when the same subject has uploads across multiple divisions.
    const allMarks = await this.prisma.studentMarks.findMany({
      where: {
        studentId: student.id,
        upload: {
          divisionId: student.divisionId,
          semesterId: student.semesterId,
        },
      },
      include: {
        upload: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        upload: {
          uploadedAt: 'desc',
        },
      },
    });

    // Deduplicate by subjectId – keep only the most recent upload per subject.
    const seen = new Set<number>();
    return allMarks.filter((m) => {
      const subjectId = m.upload.subjectId;
      if (seen.has(subjectId)) return false;
      seen.add(subjectId);
      return true;
    });
  }

  async getStudentProfile(userId: number) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: true,
        department: true,
        division: true,
        semester: true,
      },
    });

    if (!student) throw new NotFoundException('Student profile not found');
    return student;
  }

  async updateStudentProfile(userId: number, data: any) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.student.update({
      where: { id: student.id },
      data,
    });
  }

  async getUserProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User profile not found');
    return user;
  }

  async updateUserPassword(userId: number, newPassword: string) {
    // Note: In a real app, password should be hashed here.
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: newPassword }, // Simplified for compilation
    });
  }

  // Aliases for controller compatibility
  async softDeleteStudent(studentId: number) {
    return this.softDelete(studentId);
  }

  async restoreStudent(studentId: number) {
    return this.restore(studentId);
  }
}
