import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Subject } from '@prisma/client';

export interface CreateSubjectData {
  name: string;
  code: string;
  type: 'CORE' | 'OPEN_ELECTIVE' | 'PROFESSIONAL_ELECTIVE' | 'MANDATORY';
  credits?: number;
  semesterId: number;
}

export interface UpdateSubjectData {
  name?: string;
  code?: string;
  type?: 'CORE' | 'OPEN_ELECTIVE' | 'PROFESSIONAL_ELECTIVE' | 'MANDATORY';
  credits?: number;
  semesterId?: number;
}

@Injectable()
export class SubjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSubjectData): Promise<Subject> {
    const semester = await this.prisma.semester.findUnique({
      where: { id: data.semesterId },
      include: { department: true }
    });
    if (!semester) throw new NotFoundException(`Semester with ID ${data.semesterId} not found`);

    const existingSubject = await this.prisma.subject.findUnique({
      where: { code_semesterId: { code: data.code, semesterId: data.semesterId } }
    });
    if (existingSubject) throw new BadRequestException(`Subject with code ${data.code} already exists for this semester`);

    return this.prisma.subject.create({
      data: { ...data, credits: data.credits || 4 },
      include: { semester: { include: { department: true } }, _count: { select: { assignments: true, attendanceSessions: true, marksUploads: true, facultySubjects: true } } }
    });
  }

  async findAll(): Promise<Subject[]> {
    return this.prisma.subject.findMany({
      include: {
        semester: { include: { department: true } },
        facultySubjects: { include: { faculty: true, division: true } },
        _count: { select: { assignments: true, attendanceSessions: true, marksUploads: true, facultySubjects: true } }
      },
      orderBy: [{ semester: { department: { name: 'asc' } } }, { semester: { number: 'asc' } }, { code: 'asc' }]
    });
  }

  async findOne(id: number): Promise<Subject> {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        semester: { include: { department: true } },
        assignments: { where: { deletedAt: null }, include: { faculty: true, divisions: { include: { division: true } } }, orderBy: { dueDate: 'desc' } },
        attendanceSessions: { include: { faculty: true, division: true }, orderBy: { lectureDate: 'desc' } },
        marksUploads: { where: { deletedAt: null }, include: { faculty: true, division: true }, orderBy: { uploadedAt: 'desc' } },
        facultySubjects: { include: { faculty: true, division: true } },
        _count: { select: { assignments: true, attendanceSessions: true, marksUploads: true, facultySubjects: true } }
      }
    });

    if (!subject) throw new NotFoundException(`Subject with ID ${id} not found`);
    return subject;
  }

  async update(id: number, data: UpdateSubjectData): Promise<Subject> {
    await this.findOne(id);
    if (data.semesterId) {
      const semester = await this.prisma.semester.findUnique({ where: { id: data.semesterId } });
      if (!semester) throw new NotFoundException(`Semester with ID ${data.semesterId} not found`);
    }

    if (data.code) {
      const current = await this.prisma.subject.findUnique({ where: { id } });
      const existing = await this.prisma.subject.findFirst({
        where: { code: data.code, semesterId: data.semesterId || current.semesterId, id: { not: id } }
      });
      if (existing) throw new BadRequestException(`Subject with code ${data.code} already exists for this semester`);
    }

    return this.prisma.subject.update({
      where: { id },
      data,
      include: { semester: { include: { department: true } }, _count: { select: { assignments: true, attendanceSessions: true, marksUploads: true, facultySubjects: true } } }
    });
  }

  async remove(id: number): Promise<Subject> {
    await this.findOne(id);
    const [assignments, attendance, marks, faculty] = await Promise.all([
      this.prisma.assignment.count({ where: { subjectId: id, deletedAt: null } }),
      this.prisma.attendanceSession.count({ where: { subjectId: id } }),
      this.prisma.marksUpload.count({ where: { subjectId: id, deletedAt: null } }),
      this.prisma.facultySubject.count({ where: { subjectId: id } })
    ]);

    if (assignments > 0 || attendance > 0 || marks > 0 || faculty > 0) {
      throw new BadRequestException(`Cannot delete subject with related data`);
    }

    return this.prisma.subject.delete({ where: { id } });
  }

  async findBySemester(semesterId: number): Promise<Subject[]> {
    return this.prisma.subject.findMany({
      where: { semesterId },
      include: { semester: { include: { department: true } }, facultySubjects: { include: { faculty: true, division: true } }, _count: { select: { assignments: true, attendanceSessions: true, marksUploads: true, facultySubjects: true } } },
      orderBy: { code: 'asc' }
    });
  }
}
