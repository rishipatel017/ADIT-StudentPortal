import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UserRole, Prisma } from '@prisma/client';
import { CreateStudentDto, UpdateStudentDto } from './dtos/student.dto';
import { CreateFacultyDto, UpdateFacultyDto } from './dtos/faculty.dto';
import { CreateSubjectDto, UpdateSubjectDto } from './dtos/subject.dto';
import { CreateSemesterDto, UpdateSemesterDto } from './dtos/semester.dto';
import { CreateDivisionDto, UpdateDivisionDto } from './dtos/division.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Dashboard Statistics ====================
  async getDashboardStats() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalStudents,
      totalFaculty,
      totalSubjects,
      totalDivisions,
      activeAssignments,
      pendingNotices,
      recentActivities
    ] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.faculty.count(),
      this.prisma.subject.count(),
      this.prisma.division.count(),
      this.prisma.assignment.count({
        where: {
          dueDate: {
            gte: now,
          },
        },
      }),
      this.prisma.notice.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),
      this.getRecentActivities(5)
    ]);

    return {
      totalStudents,
      totalFaculty,
      totalSubjects,
      totalDivisions,
      activeAssignments,
      pendingNotices,
      recentActivities,
      summary: {
        totalUsers: totalStudents + totalFaculty,
        // completionRate: await this.calculateCompletionRate(), // Removed - method doesn't exist
      },
    };
  }

  async getFacultySubjectAssignments(filters: { semesterId?: number; facultyId?: number; subjectId?: number; divisionId?: number }) {
    const where: Prisma.FacultySubjectWhereInput = {
      ...(filters.facultyId ? { facultyId: filters.facultyId } : {}),
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      ...(filters.divisionId ? { divisionId: filters.divisionId } : {}),
      ...(filters.semesterId ? { subject: { semesterId: filters.semesterId } } : {}),
    };

    const rows = await this.prisma.facultySubject.findMany({
      where,
      include: {
        faculty: { select: { id: true, name: true, email: true, designation: true } },
        subject: { select: { id: true, name: true, code: true, semesterId: true, semester: { select: { id: true, number: true } } } },
        division: { select: { id: true, name: true, semesterId: true } },
      },
      orderBy: [
        { subject: { semester: { number: 'asc' } } },
        { subject: { code: 'asc' } },
        { division: { name: 'asc' } },
      ],
    });

    return rows;
  }

  async assignFacultyToSubject(input: { facultyId: number; subjectId: number; divisionId: number }) {
    const { facultyId, subjectId, divisionId } = input;
    const [faculty, subject, division] = await Promise.all([
      this.prisma.faculty.findUnique({ where: { id: facultyId } }),
      this.prisma.subject.findUnique({ where: { id: subjectId } }),
      this.prisma.division.findUnique({ where: { id: divisionId } }),
    ]);

    if (!faculty) throw new NotFoundException(`Faculty with ID ${facultyId} not found`);
    if (!subject) throw new NotFoundException(`Subject with ID ${subjectId} not found`);
    if (!division) throw new NotFoundException(`Division with ID ${divisionId} not found`);
    if (subject.semesterId !== division.semesterId) {
      throw new BadRequestException('Subject and Division must belong to the same semester');
    }

    try {
      const created = await this.prisma.facultySubject.create({
        data: { facultyId, subjectId, divisionId },
        include: {
          faculty: { select: { id: true, name: true, email: true, designation: true } },
          subject: { select: { id: true, name: true, code: true, semesterId: true, semester: { select: { id: true, number: true } } } },
          division: { select: { id: true, name: true, semesterId: true } },
        },
      });
      return created;
    } catch (error) {
      throw new BadRequestException(`Failed to assign faculty to subject: ${error.message}`);
    }
  }

  async unassignFacultyFromSubject(input: { facultyId: number; subjectId: number; divisionId: number }) {
    const { facultyId, subjectId, divisionId } = input;

    try {
      await this.prisma.facultySubject.delete({
        where: {
          facultyId_subjectId_divisionId: {
            facultyId,
            subjectId,
            divisionId,
          },
        },
      });

      return { success: true, message: 'Faculty subject assignment removed' };
    } catch (error) {
      throw new BadRequestException(`Failed to remove assignment: ${error.message}`);
    }
  }

  async previewPromotion(fromSemesterId: number) {
    const fromSemester = await this.prisma.semester.findUnique({ where: { id: fromSemesterId } });
    if (!fromSemester) throw new NotFoundException(`Semester with ID ${fromSemesterId} not found`);

    const fromNumber = fromSemester.number;
    const toNumber = fromNumber + 1;

    const toSemester = await this.prisma.semester.findFirst({
      where: {
        number: toNumber,
        departmentId: fromSemester.departmentId,
      },
    });

    const students = await this.prisma.student.findMany({
      where: {
        semesterId: fromSemesterId,
        deletedAt: null,
      },
      select: {
        id: true,
        enrollmentNo: true,
        name: true,
        divisionId: true,
        semesterId: true,
      },
      orderBy: { enrollmentNo: 'asc' },
    });

    const willPassOut = fromNumber >= 8;
    return {
      from: { id: fromSemester.id, number: fromNumber },
      to: toSemester ? { id: toSemester.id, number: toSemester.number } : null,
      willPassOut,
      totalStudents: students.length,
      preview: students.slice(0, 50),
    };
  }

  async executePromotion(fromSemesterId: number) {
    const fromSemester = await this.prisma.semester.findUnique({ where: { id: fromSemesterId } });
    if (!fromSemester) throw new NotFoundException(`Semester with ID ${fromSemesterId} not found`);

    const fromNumber = fromSemester.number;
    const toNumber = fromNumber + 1;
    const willPassOut = fromNumber >= 8;

    const toSemester = willPassOut
      ? null
      : await this.prisma.semester.findFirst({
          where: {
            number: toNumber,
            departmentId: fromSemester.departmentId,
          },
        });

    if (!willPassOut && !toSemester) {
      throw new BadRequestException(`Next semester not found for Semester ${fromNumber}`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const baseWhere: any = {
        semesterId: fromSemesterId,
        deletedAt: null,
      };

      if (willPassOut) {
        const updated = await (tx.student.updateMany as any)({
          where: baseWhere,
          data: { status: 'PASSED_OUT' },
        });
        return { promoted: 0, passedOut: updated.count };
      }

      const updated = await tx.student.updateMany({
        where: baseWhere,
        data: { semesterId: toSemester!.id },
      });

      return { promoted: updated.count, passedOut: 0 };
    });

    return {
      success: true,
      from: { id: fromSemester.id, number: fromNumber },
      to: willPassOut ? null : { id: toSemester!.id, number: toSemester!.number },
      ...result,
    };
  }

  // ==================== Student Management ====================
  async getAllStudents(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.StudentWhereInput = search ? {
      OR: [
        { name: { contains: search } },
        { enrollmentNo: { contains: search } },
        { email: { contains: search } },
      ],
    } : {};

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              createdAt: true,
            },
          },
          division: {
            select: {
              id: true,
              name: true,
              semester: {
                select: {
                  id: true,
                  number: true,
                },
              },
            },
          },
          semester: {
            select: {
              id: true,
              number: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.student.count({ where }),
    ]);

    return {
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStudentById(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
        division: true,
        semester: true,
        attendanceRecords: {
          include: {
            session: {
              include: {
                subject: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50, // Limit recent attendance records
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
                  },
                },
              },
            },
          },
          orderBy: {
            submittedAt: 'desc',
          },
        },
        marks: {
          include: {
            upload: {
              include: {
                subject: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            upload: {
              uploadedAt: 'desc',
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    // Calculate additional statistics
    const stats = await this.calculateStudentStats(id);

    return {
      ...student,
      statistics: stats,
    };
  }

  async createStudent(createStudentDto: CreateStudentDto) {
    const { email, password, name, enrollmentNo, divisionId, semesterId } = createStudentDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    // Check if enrollment number already exists
    const existingStudent = await this.prisma.student.findUnique({
      where: { enrollmentNo },
    });

    if (existingStudent) {
      throw new ConflictException(`Student with enrollment number ${enrollmentNo} already exists`);
    }

    // Verify division and semester exist
    await this.validateDivisionAndSemester(divisionId, semesterId);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Create student with nested user
        const student = await prisma.student.create({
          data: {
            name,
            enrollmentNo,
            email,
            department: {
              connect: { id: 1 } // Default to IT department
            },
            division: {
              connect: { id: divisionId }
            },
            semester: {
              connect: { id: semesterId }
            },
            user: {
              create: {
                email,
                password: await bcrypt.hash('student123', 12),
                role: 'STUDENT'
              }
            }
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                createdAt: true,
              },
            },
            division: true,
            semester: true,
          },
        });

        // Log activity
        // await this.logActivity('STUDENT_CREATED', `Student ${name} created`, student.user.id);

        return student;
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create student: ${error.message}`);
    }
  }

  async updateStudent(id: number, updateStudentDto: UpdateStudentDto) {
    const { email, password, name, enrollmentNo, divisionId, semesterId } = updateStudentDto;

    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    // Prepare updates
    const userUpdateData: any = {};
    const studentUpdateData: any = {};

    if (email && email !== student.user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser && existingUser.id !== student.userId) {
        throw new ConflictException(`User with email ${email} already exists`);
      }
      userUpdateData.email = email;
      studentUpdateData.email = email;
    }

    if (password) {
      userUpdateData.password = await bcrypt.hash(password, 10);
    }

    if (enrollmentNo && enrollmentNo !== student.enrollmentNo) {
      const existingStudent = await this.prisma.student.findUnique({
        where: { enrollmentNo },
      });
      if (existingStudent && existingStudent.id !== id) {
        throw new ConflictException(`Student with enrollment number ${enrollmentNo} already exists`);
      }
      studentUpdateData.enrollmentNo = enrollmentNo;
    }

    if (name) studentUpdateData.name = name;
    if (divisionId) {
      await this.validateDivision(divisionId);
      studentUpdateData.divisionId = divisionId;
    }
    if (semesterId) {
      await this.validateSemester(semesterId);
      studentUpdateData.semesterId = semesterId;
    }

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Update user if needed
        if (Object.keys(userUpdateData).length > 0) {
          await prisma.user.update({
            where: { id: student.userId },
            data: userUpdateData,
          });
        }

        // Update student
        const updatedStudent = await prisma.student.update({
          where: { id },
          data: studentUpdateData,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                createdAt: true,
              },
            },
            division: true,
            semester: true,
          },
        });

        // Log activity
        // await this.logActivity('STUDENT_UPDATED', `Student ${name || student.name} updated`, student.userId);

        return updatedStudent;
      });
    } catch (error) {
      throw new BadRequestException(`Failed to update student: ${error.message}`);
    }
  }

  async deleteStudent(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    try {
      await this.prisma.$transaction(async (prisma) => {
        // Delete related records first
        await prisma.studentMarks.deleteMany({ where: { studentId: id } });
        await prisma.attendanceRecord.deleteMany({ where: { studentId: id } });
        await prisma.assignmentSubmission.deleteMany({ where: { studentId: id } });
        
        // Delete student
        await prisma.student.delete({ where: { id } });
        
        // Delete user
        await prisma.user.delete({ where: { id: student.userId } });
      });

      return { 
        success: true,
        message: 'Student deleted successfully' 
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete student: ${error.message}`);
    }
  }

  async bulkCreateStudents(studentsData: CreateStudentDto[]) {
    const results = {
      successful: [],
      failed: [],
    };

    for (const studentData of studentsData) {
      try {
        const student = await this.createStudent(studentData);
        results.successful.push(student);
      } catch (error) {
        results.failed.push({
          data: studentData,
          error: error.message,
        });
      }
    }

    return results;
  }

  // ==================== Faculty Management ====================
  async getAllFaculty(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.FacultyWhereInput = search ? {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { designation: { contains: search } },
      ],
    } : {};

    const [faculty, total] = await Promise.all([
      this.prisma.faculty.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              createdAt: true,
            },
          },
          subjects: {
            include: {
              subject: true,
              division: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.faculty.count({ where }),
    ]);

    return {
      data: faculty,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFacultyById(id: number) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
        subjects: {
          include: {
            subject: true,
            division: true,
          },
        },
        marksUploads: {
          include: {
            subject: true,
            division: true,
          },
          orderBy: {
            uploadedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!faculty) {
      throw new NotFoundException(`Faculty with ID ${id} not found`);
    }

    // Calculate teaching load
    const teachingLoad = faculty.subjects.length;

    return {
      ...faculty,
      teachingLoad,
    };
  }

  async createFaculty(createFacultyDto: CreateFacultyDto) {
    const { email, password, name, designation, qualification, phone, joiningDate, pastExperienceYears } = createFacultyDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${email} already exists`);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Create faculty with nested user
        const faculty = await prisma.faculty.create({
          data: {
            name,
            email,
            designation,
            qualification,
            phone: phone || null,
            joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            pastExperienceYears: pastExperienceYears || 0,
            department: {
              connect: { id: 1 } // Default to IT department
            },
            user: {
              create: {
                email,
                password: hashedPassword,
                role: UserRole.FACULTY,
              },
            },
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                createdAt: true,
              },
            },
          },
        });

        // Log activity
        // await this.logActivity('FACULTY_CREATED', `Faculty ${name} created`, faculty.user.id);

        return faculty;
      });
    } catch (error) {
      throw new BadRequestException(`Failed to create faculty: ${error.message}`);
    }
  }

  async updateFaculty(id: number, updateFacultyDto: Partial<CreateFacultyDto>) {
    const { email, password, name, designation, qualification, phone, joiningDate, pastExperienceYears } = updateFacultyDto;

    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!faculty) {
      throw new NotFoundException(`Faculty with ID ${id} not found`);
    }

    const userUpdateData: any = {};
    const facultyUpdateData: any = {};

    if (email && email !== faculty.user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingUser && existingUser.id !== faculty.userId) {
        throw new ConflictException(`User with email ${email} already exists`);
      }
      userUpdateData.email = email;
      facultyUpdateData.email = email;
    }

    if (password) {
      userUpdateData.password = await bcrypt.hash(password, 10);
    }

    if (name) facultyUpdateData.name = name;
    if (designation) facultyUpdateData.designation = designation;
    if (qualification) facultyUpdateData.qualification = qualification;
    if (phone !== undefined) facultyUpdateData.phone = phone || null;
    if (joiningDate) facultyUpdateData.joiningDate = new Date(joiningDate);
    if (pastExperienceYears !== undefined) facultyUpdateData.pastExperienceYears = pastExperienceYears;

    try {
      return await this.prisma.$transaction(async (prisma) => {
        if (Object.keys(userUpdateData).length > 0) {
          await prisma.user.update({
            where: { id: faculty.userId },
            data: userUpdateData,
          });
        }

        const updatedFaculty = await prisma.faculty.update({
          where: { id },
          data: facultyUpdateData,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                createdAt: true,
              },
            },
          },
        });

        return updatedFaculty;
      });
    } catch (error) {
      throw new BadRequestException(`Failed to update faculty: ${error.message}`);
    }
  }

  async deleteFaculty(id: number) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!faculty) {
      throw new NotFoundException(`Faculty with ID ${id} not found`);
    }

    try {
      await this.prisma.$transaction(async (prisma) => {
        // Delete related records
        await prisma.facultySubject.deleteMany({ where: { facultyId: id } });
        await prisma.marksUpload.deleteMany({ where: { facultyId: id } });
        
        // Delete faculty
        await prisma.faculty.delete({ where: { id } });
        
        // Delete user
        await prisma.user.delete({ where: { id: faculty.userId } });
      });

      return { 
        success: true,
        message: 'Faculty deleted successfully' 
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete faculty: ${error.message}`);
    }
  }

  // ==================== Semester Management ====================
  async getAllSemesters() {
    const semesters = await this.prisma.semester.findMany({
      include: {
        _count: {
          select: {
            subjects: true,
            divisions: true,
            students: true,
          },
        },
      },
      orderBy: {
        number: 'asc',
      },
    });

    return semesters;
  }

  async getSemesterById(id: number) {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      include: {
        subjects: {
          include: {
            _count: {
              select: {
                assignments: true,
                attendanceSessions: true,
              },
            },
          },
        },
        divisions: {
          include: {
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
        students: {
          select: {
            id: true,
            name: true,
            enrollmentNo: true,
          },
        },
      },
    });

    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }

    return semester;
  }

  async createSemester(createSemesterDto: CreateSemesterDto) {
    const { number } = createSemesterDto;

    if (number < 1 || number > 8) {
      throw new BadRequestException('Semester number must be between 1 and 8');
    }

    const existingSemester = await this.prisma.semester.findFirst({
      where: { 
        number,
        departmentId: 1 // Default to IT department
      },
    });

    if (existingSemester) {
      throw new ConflictException(`Semester ${number} already exists`);
    }

    try {
      const semester = await this.prisma.semester.create({
        data: { 
          number,
          department: {
            connect: { id: 1 } // Default to IT department
          }
        },
      });

      // await this.logActivity('SEMESTER_CREATED', `Semester ${number} created`);

      return semester;
    } catch (error) {
      throw new BadRequestException(`Failed to create semester: ${error.message}`);
    }
  }

  async updateSemester(id: number, updateSemesterDto: UpdateSemesterDto) {
    const { number } = updateSemesterDto;

    if (typeof number === 'number' && (number < 1 || number > 8)) {
      throw new BadRequestException('Semester number must be between 1 and 8');
    }

    const semester = await this.prisma.semester.findUnique({
      where: { id },
    });

    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }

    if (number && number !== semester.number) {
      const existingSemester = await this.prisma.semester.findUnique({
        where: { 
          number_departmentId: {
            number,
            departmentId: 1
          }
        },
      });

      if (existingSemester) {
        throw new ConflictException(`Semester ${number} already exists`);
      }
    }

    try {
      const updatedSemester = await this.prisma.semester.update({
        where: { id },
        data: { number },
      });

      // await this.logActivity('SEMESTER_UPDATED', `Semester ${number} updated`);

      return updatedSemester;
    } catch (error) {
      throw new BadRequestException(`Failed to update semester: ${error.message}`);
    }
  }

  async deleteSemester(id: number) {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
    });

    if (!semester) {
      throw new NotFoundException(`Semester with ID ${id} not found`);
    }

    const relations = await this.prisma.semester.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subjects: true,
            divisions: true,
            students: true,
          },
        },
      },
    });

    if (relations?._count.subjects > 0 || relations?._count.divisions > 0 || relations?._count.students > 0) {
      throw new BadRequestException(
        `Cannot delete semester ${semester.number} as it has ${relations._count.subjects} subjects, ${relations._count.divisions} divisions, and ${relations._count.students} students`
      );
    }

    try {
      await this.prisma.semester.delete({
        where: { id },
      });

      // await this.logActivity('SEMESTER_DELETED', `Semester ${semester.number} deleted`);

      return { 
        success: true,
        message: `Semester ${semester.number} deleted successfully` 
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete semester: ${error.message}`);
    }
  }

  // ==================== Subject Management ====================
  async getAllSubjects(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.SubjectWhereInput = search ? {
      OR: [
        { name: { contains: search } },
        { code: { contains: search } },
      ],
    } : {};

    const [subjects, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        include: {
          semester: {
            select: {
              id: true,
              number: true,
            },
          },
          _count: {
            select: {
              assignments: true,
              attendanceSessions: true,
              facultySubjects: true,
            },
          },
        },
        orderBy: [
          { semester: { number: 'asc' } },
          { code: 'asc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.subject.count({ where }),
    ]);

    return {
      data: subjects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSubjectById(id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        semester: true,
        assignments: {
          include: {
            _count: {
              select: {
                submissions: true,
              },
            },
          },
        },
        attendanceSessions: {
          include: {
            _count: {
              select: {
                records: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
        facultySubjects: {
          include: {
            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            division: {
              select: {
                id: true,
                name: true,
                semester: {
                  select: {
                    number: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    return subject;
  }

  async createSubject(createSubjectDto: CreateSubjectDto) {
    const { name, code, type, credits, semesterId } = createSubjectDto;

    // Convert string type to enum
    const subjectType = type as 'THEORY' | 'PRACTICAL' | 'THEORY_PRACTICAL';

    // Check if subject with same code exists in the semester
    const existingSubject = await this.prisma.subject.findUnique({
      where: {
        code_semesterId: {
          code,
          semesterId,
        },
      },
    });

    if (existingSubject) {
      throw new ConflictException(`Subject with code ${code} already exists in this semester`);
    }

    // Verify semester exists
    await this.validateSemester(semesterId);

    try {
      const subject = await this.prisma.subject.create({
        data: {
          name,
          code,
          type: subjectType,
          credits,
          semesterId,
        },
        include: {
          semester: {
            select: {
              id: true,
              number: true,
            },
          },
        },
      });

      // await this.logActivity('SUBJECT_CREATED', `Subject ${name} (${code}) created`);

      return subject;
    } catch (error) {
      throw new BadRequestException(`Failed to create subject: ${error.message}`);
    }
  }

  async updateSubject(id: number, updateSubjectDto: UpdateSubjectDto) {
    const { name, code, type, credits, semesterId } = updateSubjectDto;

    // Convert string type to enum if provided
    const subjectType = type as 'THEORY' | 'PRACTICAL' | 'THEORY_PRACTICAL' | undefined;

    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    // Check for duplicate code in semester
    if (code && semesterId && (code !== subject.code || semesterId !== subject.semesterId)) {
      const existingSubject = await this.prisma.subject.findUnique({
        where: {
          code_semesterId: {
            code,
            semesterId,
          },
        },
      });

      if (existingSubject && existingSubject.id !== id) {
        throw new ConflictException(`Subject with code ${code} already exists in this semester`);
      }
    }

    try {
      const updatedSubject = await this.prisma.subject.update({
        where: { id },
        data: {
          name,
          code,
          type: subjectType,
          credits,
          semesterId,
        },
        include: {
          semester: {
            select: {
              id: true,
              number: true,
            },
          },
        },
      });

      // await this.logActivity('SUBJECT_UPDATED', `Subject ${name || subject.name} updated`);

      return updatedSubject;
    } catch (error) {
      throw new BadRequestException(`Failed to update subject: ${error.message}`);
    }
  }

  async deleteSubject(id: number) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assignments: true,
            attendanceSessions: true,
            facultySubjects: true,
          },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    if (subject._count.assignments > 0 || subject._count.attendanceSessions > 0 || subject._count.facultySubjects > 0) {
      throw new BadRequestException(
        `Cannot delete subject ${subject.code} as it has ${subject._count.assignments} assignments, ${subject._count.attendanceSessions} attendance sessions, and ${subject._count.facultySubjects} faculty assignments`
      );
    }

    try {
      await this.prisma.subject.delete({
        where: { id },
      });

      // await this.logActivity('SUBJECT_DELETED', `Subject ${subject.code} deleted`);

      return {
        success: true,
        message: `Subject ${subject.code} deleted successfully`,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete subject: ${error.message}`);
    }
  }

  // ==================== Division Management ====================
  async getAllDivisions(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    const where: Prisma.DivisionWhereInput = search ? {
      OR: [
        { name: { contains: search } },
      ],
    } : {};

    const [divisions, total] = await Promise.all([
      this.prisma.division.findMany({
        where,
        include: {
          semester: {
            select: {
              id: true,
              number: true,
            },
          },
          _count: {
            select: {
              students: true,
              facultySubjects: true,
            },
          },
        },
        orderBy: [
          { semester: { number: 'asc' } },
          { name: 'asc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.division.count({ where }),
    ]);

    return {
      data: divisions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDivisionById(id: number) {
    const division = await this.prisma.division.findUnique({
      where: { id },
      include: {
        semester: true,
        students: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: {
            enrollmentNo: 'asc',
          },
        },
        facultySubjects: {
          include: {
            faculty: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
                credits: true,
              },
            },
          },
        },
      },
    });

    if (!division) {
      throw new NotFoundException(`Division with ID ${id} not found`);
    }

    return division;
  }

  async createDivision(createDivisionDto: CreateDivisionDto) {
    const { name, semesterId } = createDivisionDto;

    // Check if division with same name exists in the semester
    const existingDivision = await this.prisma.division.findUnique({
      where: {
        name_semesterId: {
          name,
          semesterId,
        },
      },
    });

    if (existingDivision) {
      throw new ConflictException(`Division ${name} already exists in this semester`);
    }

    // Verify semester exists
    await this.validateSemester(semesterId);

    try {
      const division = await this.prisma.division.create({
        data: {
          name,
          semesterId,
        },
        include: {
          semester: {
            select: {
              id: true,
              number: true,
            },
          },
        },
      });

      // await this.logActivity('DIVISION_CREATED', `Division ${name} created for Semester ${division.semester.number}`);

      return division;
    } catch (error) {
      throw new BadRequestException(`Failed to create division: ${error.message}`);
    }
  }

  async updateDivision(id: number, updateDivisionDto: Partial<CreateDivisionDto>) {
    const { name, semesterId } = updateDivisionDto;

    const division = await this.prisma.division.findUnique({
      where: { id },
      include: { semester: true },
    });

    if (!division) {
      throw new NotFoundException(`Division with ID ${id} not found`);
    }

    // Check for duplicate name in semester
    if (name && semesterId && (name !== division.name || semesterId !== division.semesterId)) {
      const existingDivision = await this.prisma.division.findUnique({
        where: {
          name_semesterId: {
            name,
            semesterId,
          },
        },
      });

      if (existingDivision && existingDivision.id !== id) {
        throw new ConflictException(`Division ${name} already exists in this semester`);
      }
    }

    try {
      const updatedDivision = await this.prisma.division.update({
        where: { id },
        data: {
          name,
          semesterId,
        },
        include: {
          semester: {
            select: {
              id: true,
              number: true,
            },
          },
        },
      });

      // await this.logActivity('DIVISION_UPDATED', `Division ${name || division.name} updated`);

      return updatedDivision;
    } catch (error) {
      throw new BadRequestException(`Failed to update division: ${error.message}`);
    }
  }

  async deleteDivision(id: number) {
    const division = await this.prisma.division.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            students: true,
            facultySubjects: true,
          },
        },
      },
    });

    if (!division) {
      throw new NotFoundException(`Division with ID ${id} not found`);
    }

    if (division._count.students > 0 || division._count.facultySubjects > 0) {
      throw new BadRequestException(
        `Cannot delete division ${division.name} as it has ${division._count.students} students and ${division._count.facultySubjects} faculty assignments`
      );         
    }

    try {
      await this.prisma.division.delete({
        where: { id },
      });

      // await this.logActivity('DIVISION_DELETED', `Division ${division.name} deleted`);

      return {
        success: true,
        message: `Division ${division.name} deleted successfully`,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete division: ${error.message}`);
    }
  }

  // ==================== Analytics and Reports ====================
  async getSystemAnalytics() {
    const [
      totalUsers,
      activeToday,
      popularSubjects,
      attendanceRate,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.getPopularSubjects(5),
      this.calculateOverallAttendanceRate(),
    ]);

    return {
      totalUsers,
      activeToday,
      activePercentage: totalUsers > 0 ? (activeToday / totalUsers) * 100 : 0,
      popularSubjects,
      attendanceRate,
      timestamp: new Date(),
    };
  }

  // User activity logs removed - ActivityLog model doesn't exist
  async getUserActivityLogs(page = 1, limit = 20) {
    return {
      data: [],
      meta: {
        total: 0,
        page,
        limit,
        totalPages: 0,
      },
    };
  }

  // ==================== Helper Methods ====================
  private async validateSemester(semesterId: number) {
    const semester = await this.prisma.semester.findUnique({
      where: { id: semesterId },
    });

    if (!semester) {
      throw new NotFoundException(`Semester with ID ${semesterId} not found`);
    }

    if (semester.number < 1 || semester.number > 8) {
      throw new BadRequestException('Semester number must be between 1 and 8');
    }

    return semester;
  }

  private async validateDivision(divisionId: number) {
    const division = await this.prisma.division.findUnique({
      where: { id: divisionId },
    });

    if (!division) {
      throw new NotFoundException(`Division with ID ${divisionId} not found`);
    }

    return division;
  }

  private async validateDivisionAndSemester(divisionId: number, semesterId: number) {
    const [division, semester] = await Promise.all([
      this.validateDivision(divisionId),
      this.validateSemester(semesterId),
    ]);

    if (division.semesterId !== semesterId) {
      throw new BadRequestException('Division does not belong to the specified semester');
    }

    return { division, semester };
  }

  // Activity logging removed - ActivityLog model doesn't exist
  // private async logActivity(action: string, details: string, userId?: number) {
  //   try {
  //     await this.prisma.activityLog.create({
  //       data: {
  //         action,
  //         details,
  //         userId,
  //         createdAt: new Date(),
  //       },
  //     });
  //   } catch (error) {
  //     console.error('Failed to log activity:', error);
  //   }
  // }

  // Recent activities removed - ActivityLog model doesn't exist
  private async getRecentActivities(limit: number) {
    return []; // Return empty array for now
  }

  private async calculateStudentStats(studentId: number) {
    const [attendance, assignments, marks] = await Promise.all([
      this.prisma.attendanceRecord.count({
        where: {
          studentId,
          status: true,
        },
      }),
      this.prisma.assignmentSubmission.count({
        where: {
          studentId,
        },
      }),
      this.prisma.studentMarks.aggregate({
        where: {
          studentId,
        },
        _avg: {
          marksObtained: true,
        },
        _count: true,
      }),
    ]);

    return {
      totalAttendance: attendance,
      totalSubmissions: assignments,
      averageMarks: marks._avg.marksObtained || 0,
      totalMarksEntries: marks._count,
    };
  }

  private async getPopularSubjects(limit: number) {
    const subjects = await this.prisma.subject.findMany({
      include: {
        _count: {
          select: {
            assignments: true,
            attendanceSessions: true,
          },
        },
      },
      orderBy: [
        { assignments: { _count: 'desc' } },
        { attendanceSessions: { _count: 'desc' } },
      ],
      take: limit,
    });

    return subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      assignmentCount: subject._count.assignments,
      sessionCount: subject._count.attendanceSessions,
    }));
  }

  private async calculateOverallAttendanceRate() {
    const totalRecords = await this.prisma.attendanceRecord.count();
    if (totalRecords === 0) return 0;

    const presentRecords = await this.prisma.attendanceRecord.count({
      where: {
        status: true,
      },
    });

    return (presentRecords / totalRecords) * 100;
  }

  async searchAcademicData(
    type: 'students' | 'subjects' | 'faculty',
    query: string,
    semesterId?: number,
  ) {
    const searchQuery = query.toLowerCase();

    switch (type) {
      case 'students':
        return this.prisma.student.findMany({
          where: {
            AND: [
              {
                OR: [
                  { name: { contains: searchQuery } },
                  { enrollmentNo: { contains: searchQuery } },
                  { email: { contains: searchQuery } },
                ],
              },
              semesterId ? { semesterId } : {},
            ],
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                createdAt: true,
              },
            },
            division: {
              select: {
                id: true,
                name: true,
              },
            },
            semester: {
              select: {
                id: true,
                number: true,
              },
            },
          },
          take: 50,
        });

      case 'subjects':
        return this.prisma.subject.findMany({
          where: {
            AND: [
              {
                OR: [
                  { name: { contains: searchQuery } },
                  { code: { contains: searchQuery } },
                  { type: { contains: searchQuery } },
                ],
              },
              semesterId ? { semesterId } : {},
            ],
          },
          include: {
            semester: {
              select: {
                id: true,
                number: true,
              },
            },
          },
          take: 50,
        });

      case 'faculty':
        return this.prisma.faculty.findMany({
          where: {
            OR: [
              { name: { contains: searchQuery } },
              { email: { contains: searchQuery } },
              { designation: { contains: searchQuery } },
              { qualification: { contains: searchQuery } },
            ],
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                createdAt: true,
              },
            },
          },
          take: 50,
        });

      default:
        throw new BadRequestException('Invalid search type');
    }
  }

  async getAdminProfile(userId: number) {
    return this.prisma.admin.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async updateAdminProfile(userId: number, updateData: any) {
    return this.prisma.admin.update({
      where: { userId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async getUserProfile(userId: number) {
    // Try to find user in admin, faculty, or student tables
    const admin = await this.prisma.admin.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (admin) {
      return { ...admin, role: 'ADMIN' };
    }

    const faculty = await this.prisma.faculty.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (faculty) {
      return { ...faculty, role: 'FACULTY' };
    }

    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
        division: true,
        semester: true,
      },
    });

    if (student) {
      return { ...student, role: 'STUDENT' };
    }

    throw new BadRequestException('User not found');
  }

  async updateUserPassword(userId: number, newPassword: string) {
    // Hash the new password
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}