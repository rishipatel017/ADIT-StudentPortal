import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Semester } from '@prisma/client';

export interface CreateSemesterData {
  number: number;
  departmentId: number;
}

export interface UpdateSemesterData {
  number?: number;
  departmentId?: number;
}

@Injectable()
export class SemesterService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSemesterData): Promise<Semester> {
    const department = await this.prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!department) throw new NotFoundException(`Department with ID ${data.departmentId} not found`);

    const existingSemester = await this.prisma.semester.findUnique({
      where: { number_departmentId: { number: data.number, departmentId: data.departmentId } }
    });
    if (existingSemester) throw new BadRequestException(`Semester ${data.number} already exists for department ${department.name}`);

    return this.prisma.semester.create({
      data,
      include: { department: true, _count: { select: { subjects: true, divisions: true, students: true, assignments: true, notices: true } } }
    });
  }

  async findAll(): Promise<Semester[]> {
    return this.prisma.semester.findMany({
      include: { department: true, _count: { select: { subjects: true, divisions: true, students: true, assignments: true, notices: true } } },
      orderBy: [{ department: { name: 'asc' } }, { number: 'asc' }]
    });
  }

  async findOne(id: number): Promise<Semester> {
    const semester = await this.prisma.semester.findUnique({
      where: { id },
      include: {
        department: true,
        subjects: { include: { _count: { select: { assignments: true, attendanceSessions: true, marksUploads: true, facultySubjects: true } } }, orderBy: { code: 'asc' } },
        divisions: { include: { _count: { select: { students: true, attendanceSessions: true, assignmentDivisions: true, marksUploads: true, notices: true } } }, orderBy: { name: 'asc' } },
        students: { where: { deletedAt: null }, include: { division: true, user: { select: { email: true, lastLogin: true } } }, orderBy: { enrollmentNo: 'asc' } },
        _count: { select: { subjects: true, divisions: true, students: true, assignments: true, notices: true } }
      }
    });

    if (!semester) throw new NotFoundException(`Semester with ID ${id} not found`);
    return semester;
  }

  async update(id: number, data: UpdateSemesterData): Promise<Semester> {
    await this.findOne(id);
    if (data.departmentId) {
      const department = await this.prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!department) throw new NotFoundException(`Department with ID ${data.departmentId} not found`);
    }

    if (data.number) {
      const current = await this.prisma.semester.findUnique({ where: { id } });
      const existing = await this.prisma.semester.findFirst({
        where: { number: data.number, departmentId: data.departmentId || current.departmentId, id: { not: id } }
      });
      if (existing) throw new BadRequestException(`Semester ${data.number} already exists for this department`);
    }

    return this.prisma.semester.update({
      where: { id },
      data,
      include: { department: true, _count: { select: { subjects: true, divisions: true, students: true, assignments: true, notices: true } } }
    });
  }

  async remove(id: number): Promise<Semester> {
    await this.findOne(id);
    const [subjects, divisions, students] = await Promise.all([
      this.prisma.subject.count({ where: { semesterId: id } }),
      this.prisma.division.count({ where: { semesterId: id } }),
      this.prisma.student.count({ where: { semesterId: id, deletedAt: null } })
    ]);

    if (subjects > 0 || divisions > 0 || students > 0) {
      throw new BadRequestException(`Cannot delete semester with related subjects, divisions, or students`);
    }

    return this.prisma.semester.delete({ where: { id } });
  }

  async findByDepartment(departmentId: number): Promise<Semester[]> {
    return this.prisma.semester.findMany({
      where: { departmentId },
      include: { department: true, _count: { select: { subjects: true, divisions: true, students: true, assignments: true, notices: true } } },
      orderBy: { number: 'asc' }
    });
  }

  async getSemesterStats(id: number) {
    const [totalSubjects, totalDivisions, totalStudents, totalAssignments, totalAttendance, totalMarks, activeAssignments, recentNotices] = await Promise.all([
      this.prisma.subject.count({ where: { semesterId: id } }),
      this.prisma.division.count({ where: { semesterId: id } }),
      this.prisma.student.count({ where: { semesterId: id, deletedAt: null } }),
      this.prisma.assignment.count({ where: { semesterId: id, deletedAt: null } }),
      this.prisma.attendanceSession.count({ where: { semesterId: id } }),
      this.prisma.marksUpload.count({ where: { semesterId: id, deletedAt: null } }),
      this.prisma.assignment.count({ where: { semesterId: id, dueDate: { gt: new Date() }, deletedAt: null } }),
      this.prisma.notice.count({ where: { semesterId: id, deletedAt: null, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
    ]);

    return { totalSubjects, totalDivisions, totalStudents, totalAssignments, totalAttendance, totalMarks, activeAssignments, recentNotices };
  }

  async getSemesterSubjects(id: number) {
    return this.prisma.subject.findMany({ where: { semesterId: id }, include: { facultySubjects: { include: { faculty: true } } }, orderBy: { code: 'asc' } });
  }

  async getSemesterDivisions(id: number) {
    return this.prisma.division.findMany({ where: { semesterId: id }, include: { _count: { select: { students: true } } }, orderBy: { name: 'asc' } });
  }

  async getSemesterStudents(id: number) {
    return this.prisma.student.findMany({ where: { semesterId: id, deletedAt: null }, include: { user: true, division: true }, orderBy: { enrollmentNo: 'asc' } });
  }

  async getSemesterAssignments(id: number) {
    return this.prisma.assignment.findMany({ where: { semesterId: id, deletedAt: null }, include: { subject: true, faculty: true, _count: { select: { submissions: true } } }, orderBy: { dueDate: 'asc' } });
  }

  async getSemesterMarks(id: number) {
    return this.prisma.marksUpload.findMany({ where: { semesterId: id, deletedAt: null }, include: { subject: true, faculty: true, division: true, _count: { select: { marks: true } } }, orderBy: { uploadedAt: 'desc' } });
  }

  async softDeleteSemester(id: number) {
    return this.findOne(id); // Placeholder as deletedAt is not on Semester model
  }

  async restoreSemester(id: number) {
    return this.findOne(id); // Placeholder
  }

  async getSemestersSummary() {
    const [total, active, departments] = await Promise.all([
      this.prisma.semester.count(),
      this.prisma.semester.count({ where: { assignments: { some: { dueDate: { gt: new Date() }, deletedAt: null } } } }),
      this.prisma.department.count()
    ]);
    return { totalSemesters: total, activeSemesters: active, totalDepartments: departments, averageAssignmentsPerSemester: total > 0 ? active / total : 0 };
  }

  async getSemestersPerformance() {
    const semesters = await this.prisma.semester.findMany({ include: { assignments: { where: { deletedAt: null }, include: { submissions: true } }, students: true, subjects: true } });
    return semesters.map(s => ({
      id: s.id, number: s.number, totalAssignments: s.assignments.length,
      performance: s.assignments.length > 0 ? (s.assignments.filter(a => a.dueDate < new Date() && s.students.every(st => a.submissions.some(sub => sub.studentId === st.id))).length / s.assignments.length) * 100 : 0
    }));
  }
}
