import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Department } from '@prisma/client';

export interface CreateDepartmentData {
  name: string;
  code: string;
}

export interface UpdateDepartmentData {
  name?: string;
  code?: string;
}

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDepartmentData): Promise<Department> {
    const existingDepartment = await this.prisma.department.findUnique({ where: { code: data.code } });
    if (existingDepartment) throw new BadRequestException(`Department with code ${data.code} already exists`);

    return this.prisma.department.create({
      data,
      include: { _count: { select: { semesters: true, faculty: true, students: true, notices: true } } }
    });
  }

  async findAll(includeDeleted: boolean = false): Promise<Department[]> {
    return this.prisma.department.findMany({
      include: { _count: { select: { semesters: true, faculty: true, students: true, notices: true } } },
      orderBy: { name: 'asc' }
    });
  }

  async findOne(id: number): Promise<Department> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        semesters: { orderBy: { number: 'asc' } },
        faculty: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
        students: { where: { deletedAt: null }, orderBy: { enrollmentNo: 'asc' } },
        notices: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { semesters: true, faculty: true, students: true, notices: true } }
      }
    });

    if (!department) throw new NotFoundException(`Department with ID ${id} not found`);
    return department;
  }

  async update(id: number, data: UpdateDepartmentData): Promise<Department> {
    await this.findOne(id);
    if (data.code) {
      const existingDepartment = await this.prisma.department.findUnique({ where: { code: data.code } });
      if (existingDepartment && existingDepartment.id !== id) throw new BadRequestException(`Department code ${data.code} is already taken`);
    }

    return this.prisma.department.update({
      where: { id },
      data,
      include: { _count: { select: { semesters: true, faculty: true, students: true, notices: true } } }
    });
  }

  async remove(id: number): Promise<Department> {
    await this.findOne(id);
    const [semesters, faculty, students] = await Promise.all([
      this.prisma.semester.count({ where: { departmentId: id } }),
      this.prisma.faculty.count({ where: { departmentId: id, deletedAt: null } }),
      this.prisma.student.count({ where: { departmentId: id, deletedAt: null } })
    ]);

    if (semesters > 0 || faculty > 0 || students > 0) {
      throw new BadRequestException(`Cannot delete department with related data`);
    }

    return this.prisma.department.delete({ where: { id } });
  }

  async findByCode(code: string): Promise<Department> {
    const department = await this.prisma.department.findUnique({
      where: { code },
      include: { _count: { select: { semesters: true, faculty: true, students: true, notices: true } } }
    });
    if (!department) throw new NotFoundException(`Department with code ${code} not found`);
    return department;
  }

  async getDepartmentStats(id: number) {
    const [totalSemesters, totalFaculty, totalStudents, totalSubjects, totalDivisions, activeAssignments, recentNotices] = await Promise.all([
      this.prisma.semester.count({ where: { departmentId: id } }),
      this.prisma.faculty.count({ where: { departmentId: id } }),
      this.prisma.student.count({ where: { departmentId: id } }),
      this.prisma.subject.count({ where: { semester: { departmentId: id } } }),
      this.prisma.division.count({ where: { semester: { departmentId: id } } }),
      this.prisma.assignment.count({ where: { semester: { departmentId: id }, dueDate: { gt: new Date() }, deletedAt: null } }),
      this.prisma.notice.count({ where: { departmentId: id, deletedAt: null, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
    ]);

    return { totalSemesters, totalFaculty, totalStudents, totalSubjects, totalDivisions, activeAssignments, recentNotices };
  }

  async getDepartmentSemesters(id: number) {
    return this.prisma.semester.findMany({ where: { departmentId: id }, orderBy: { number: 'asc' } });
  }

  async getDepartmentFaculty(id: number) {
    return this.prisma.faculty.findMany({ where: { departmentId: id, deletedAt: null }, include: { user: true }, orderBy: { name: 'asc' } });
  }

  async getDepartmentStudents(id: number) {
    return this.prisma.student.findMany({ where: { departmentId: id, deletedAt: null }, include: { user: true, semester: true, division: true }, orderBy: { enrollmentNo: 'asc' } });
  }

  async getDepartmentSubjects(id: number) {
    return this.prisma.subject.findMany({ where: { semester: { departmentId: id } }, include: { semester: true }, orderBy: { code: 'asc' } });
  }

  async getDepartmentsSummary() {
    const [total, withFaculty, withStudents] = await Promise.all([
      this.prisma.department.count(),
      this.prisma.department.count({ where: { faculty: { some: { deletedAt: null } } } }),
      this.prisma.department.count({ where: { students: { some: { deletedAt: null } } } })
    ]);
    return { totalDepartments: total, departmentsWithFaculty: withFaculty, departmentsWithStudents: withStudents };
  }

  async getDepartmentsPerformance() {
    const departments = await this.prisma.department.findMany({ include: { _count: { select: { faculty: true, students: true } } } });
    return departments.map(d => ({ id: d.id, name: d.name, facultyCount: d._count.faculty, studentCount: d._count.students }));
  }

  async softDeleteDepartment(id: number) {
    return this.prisma.department.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async restoreDepartment(id: number) {
    return this.prisma.department.update({
      where: { id },
      data: { deletedAt: null }
    });
  }
}
