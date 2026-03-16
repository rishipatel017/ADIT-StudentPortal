import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AcademicContext {
  semester: { id: number; number: number; departmentId: number };
  subject: { id: number; name: string; code: string; type: string; credits: number };
  division: { id: number; name: string };
  students: Array<{ id: number; name: string; enrollmentNo: string; email: string }>;
  faculty?: { id: number; name: string; email: string; designation: string };
}

export interface StudentContext {
  student: { id: number; name: string; enrollmentNo: string; email: string };
  semester: { id: number; number: number };
  division: { id: number; name: string };
  subjects: Array<{ id: number; name: string; code: string; type: string; credits: number; faculty?: { id: number; name: string; email: string } }>;
}

@Injectable()
export class AcademicCoreService {
  constructor(private readonly prisma: PrismaService) {}

  async getFacultySubjects(userId: number) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { userId },
    });
    if (!faculty) {
      throw new NotFoundException('Faculty profile not found');
    }
    return this.getFacultyAssignments(faculty.id);
  }

  async loadAcademicContext(semesterId: number, subjectId: number, divisionId: number, facultyId?: number): Promise<AcademicContext> {
    const [semester, subject, division] = await Promise.all([
      this.prisma.semester.findUnique({ where: { id: semesterId }, select: { id: true, number: true, departmentId: true } }),
      this.prisma.subject.findUnique({ where: { id: subjectId }, select: { id: true, name: true, code: true, type: true, credits: true } }),
      this.prisma.division.findUnique({ where: { id: divisionId }, select: { id: true, name: true } })
    ]);

    if (!semester) throw new NotFoundException(`Semester ${semesterId} not found`);
    if (!subject) throw new NotFoundException(`Subject ${subjectId} not found`);
    if (!division) throw new NotFoundException(`Division ${divisionId} not found`);

    const students = await this.prisma.student.findMany({
      where: { divisionId, semesterId, deletedAt: null },
      select: { id: true, name: true, enrollmentNo: true, email: true },
      orderBy: { enrollmentNo: 'asc' }
    });

    let faculty;
    if (facultyId) {
      faculty = await this.prisma.faculty.findUnique({
        where: { id: facultyId },
        select: { id: true, name: true, email: true, designation: true }
      });
    }

    return { semester, subject, division, students, faculty };
  }

  async loadStudentContext(studentId: number): Promise<StudentContext> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { semester: { select: { id: true, number: true } }, division: { select: { id: true, name: true } } }
    });

    if (!student) throw new NotFoundException(`Student ${studentId} not found`);

    const subjects = await this.prisma.subject.findMany({
      where: { semesterId: student.semesterId },
      include: { facultySubjects: { where: { divisionId: student.divisionId }, include: { faculty: { select: { id: true, name: true, email: true } } } } },
      orderBy: { code: 'asc' }
    });

    return {
      student: { id: student.id, name: student.name, enrollmentNo: student.enrollmentNo, email: student.email },
      semester: student.semester,
      division: student.division,
      subjects: subjects.map(s => ({ id: s.id, name: s.name, code: s.code, type: s.type, credits: s.credits, faculty: s.facultySubjects[0]?.faculty }))
    };
  }

  async validateFacultyAccess(facultyId: number, subjectId: number, divisionId: number): Promise<boolean> {
    const access = await this.prisma.facultySubject.findUnique({
      where: {
        facultyId_subjectId_divisionId: {
          facultyId,
          subjectId,
          divisionId
        }
      }
    });
    return !!access;
  }

  async getFacultyAssignments(facultyId: number) {
    const assignments = await this.prisma.facultySubject.findMany({
      where: { facultyId },
      include: { subject: { include: { semester: { select: { id: true, number: true } } } }, division: { select: { id: true, name: true } } },
      orderBy: [{ subject: { semester: { number: 'asc' } } }, { subject: { code: 'asc' } }]
    });

    return assignments.map(a => ({
      semester: a.subject.semester,
      subject: { id: a.subject.id, name: a.subject.name, code: a.subject.code, type: a.subject.type, credits: a.subject.credits },
      division: a.division
    }));
  }

  async getAcademicOptions() {
    const [semesters, subjects, divisions] = await Promise.all([
      this.prisma.semester.findMany({ select: { id: true, number: true }, orderBy: { number: 'asc' } }),
      this.prisma.subject.findMany({ select: { id: true, name: true, code: true, semesterId: true, semester: { select: { number: true } } }, orderBy: [{ semester: { number: 'asc' } }, { code: 'asc' }] }),
      this.prisma.division.findMany({ select: { id: true, name: true, semesterId: true, semester: { select: { number: true } } }, orderBy: [{ semester: { number: 'asc' } }, { name: 'asc' }] })
    ]);

    return { semesters, subjects: subjects.map(s => ({ ...s, semesterNumber: s.semester.number })), divisions: divisions.map(d => ({ ...d, semesterNumber: d.semester.number })) };
  }

  async getSemesters() {
    return this.prisma.semester.findMany({ orderBy: { number: 'asc' } });
  }

  async getDivisions(semesterId: number) {
    return this.prisma.division.findMany({ where: { semesterId }, orderBy: { name: 'asc' } });
  }

  async getSubjects(semesterId: number) {
    return this.prisma.subject.findMany({ where: { semesterId }, orderBy: { code: 'asc' } });
  }

  async getStudents(semesterId: number, divisionId: number) {
    return this.prisma.student.findMany({
      where: { semesterId, divisionId, deletedAt: null },
      include: { user: true },
      orderBy: { enrollmentNo: 'asc' }
    });
  }

  async getDashboardStats(user: any) {
    const [totalStudents, totalFaculty, totalDepartments] = await Promise.all([
      this.prisma.student.count({ where: { deletedAt: null } }),
      this.prisma.faculty.count({ where: { deletedAt: null } }),
      this.prisma.department.count()
    ]);

    // Role-specific stats
    let roleStats = {};
    if (user.role === 'FACULTY') {
      const faculty = await this.prisma.faculty.findUnique({ where: { userId: user.id } });
      if (faculty) {
        const [assignments, notices] = await Promise.all([
          this.prisma.facultySubject.count({ where: { facultyId: faculty.id } }),
          this.prisma.notice.count({ where: { createdById: user.id } })
        ]);
        roleStats = { assignments, notices };
      }
    }

    return { totalStudents, totalFaculty, totalDepartments, ...roleStats };
  }

  async searchAcademicData(type: string, query: string, semesterId?: number) {
    const q = query.toLowerCase();
    switch (type) {
      case 'student':
        return this.prisma.student.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { enrollmentNo: { contains: q } }
            ],
            semesterId: semesterId || undefined,
            deletedAt: null
          },
          take: 10
        });
      case 'subject':
        return this.prisma.subject.findMany({
          where: {
            OR: [
              { name: { contains: q } },
              { code: { contains: q } }
            ],
            semesterId: semesterId || undefined
          },
          take: 10
        });
      default:
        return [];
    }
  }
}
