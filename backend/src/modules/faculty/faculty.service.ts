import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Faculty } from '@prisma/client';

export interface CreateFacultyData {
  name: string;
  email: string;
  designation: string;
  qualification: string;
  phone?: string;
  joiningDate: Date;
  pastExperienceYears?: number;
  departmentId: number;
  userId: number;
}

export interface UpdateFacultyData {
  name?: string;
  email?: string;
  designation?: string;
  qualification?: string;
  phone?: string;
  joiningDate?: Date;
  pastExperienceYears?: number;
  departmentId?: number;
  userId?: number;
  deletedAt?: Date;
}

@Injectable()
export class FacultyService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveFaculty(userIdOrFacultyId: number): Promise<Faculty> {
    const faculty = await this.prisma.faculty.findFirst({
      where: {
        deletedAt: null,
        OR: [{ userId: userIdOrFacultyId }, { id: userIdOrFacultyId }],
      },
    });

    if (!faculty) throw new NotFoundException('Faculty not found');
    return faculty;
  }

  async create(data: CreateFacultyData): Promise<Faculty> {
    const [department, user] = await Promise.all([
      this.prisma.department.findUnique({ where: { id: data.departmentId } }),
      this.prisma.user.findUnique({ where: { id: data.userId } })
    ]);

    if (!department) throw new NotFoundException(`Department with ID ${data.departmentId} not found`);
    if (!user) throw new NotFoundException(`User with ID ${data.userId} not found`);

    const existingUserFaculty = await this.prisma.faculty.findUnique({ where: { userId: data.userId } });
    if (existingUserFaculty) throw new BadRequestException(`User with ID ${data.userId} already linked to faculty`);

    return this.prisma.faculty.create({
      data: { ...data, pastExperienceYears: data.pastExperienceYears || 0 },
      include: {
        user: { select: { id: true, email: true, role: true, lastLogin: true } },
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { subjects: true, assignments: true, marksUploads: true, attendanceSessions: true } }
      }
    });
  }

  async findAll(includeDeleted: boolean = false): Promise<Faculty[]> {
    return this.prisma.faculty.findMany({
      where: { deletedAt: includeDeleted ? undefined : null },
      include: {
        user: { select: { id: true, email: true, role: true, lastLogin: true } },
        department: { select: { id: true, name: true, code: true } },
        subjects: {
          include: {
            subject: {
              select: {
                id: true, name: true, code: true, type: true, credits: true,
                semester: { select: { id: true, number: true, department: { select: { id: true, name: true, code: true } } } }
              }
            },
            division: { select: { id: true, name: true } }
          }
        },
        _count: { select: { subjects: true, assignments: true, marksUploads: true, attendanceSessions: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findOne(id: number): Promise<Faculty> {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, role: true, lastLogin: true } },
        department: { select: { id: true, name: true, code: true } },
        subjects: {
          include: {
            subject: {
              include: {
                semester: { include: { department: { select: { id: true, name: true, code: true } } } },
                _count: { select: { assignments: true, attendanceSessions: true, marksUploads: true } }
              }
            },
            division: { select: { id: true, name: true, semester: { select: { id: true, number: true } } } }
          }
        },
        assignments: {
          where: { deletedAt: null },
          include: {
            subject: { select: { id: true, name: true, code: true } },
            divisions: { include: { division: { select: { id: true, name: true } } } },
            submissions: true,
            _count: { select: { submissions: true } }
          },
          orderBy: { dueDate: 'desc' }
        },
        marksUploads: {
          where: { deletedAt: null },
          include: {
            subject: { select: { id: true, name: true, code: true } },
            division: { select: { id: true, name: true } },
            marks: true,
            _count: { select: { marks: true } }
          },
          orderBy: { uploadedAt: 'desc' }
        },
        attendanceSessions: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            division: { select: { id: true, name: true } },
            records: true,
            _count: { select: { records: true } }
          },
          orderBy: { lectureDate: 'desc' }
        },
        _count: { select: { subjects: true, assignments: true, marksUploads: true, attendanceSessions: true } }
      }
    });

    if (!faculty) throw new NotFoundException(`Faculty with ID ${id} not found`);
    return faculty;
  }

  async update(id: number, data: UpdateFacultyData): Promise<Faculty> {
    await this.findOne(id);
    if (data.departmentId) {
      const department = await this.prisma.department.findUnique({ where: { id: data.departmentId } });
      if (!department) throw new NotFoundException(`Department with ID ${data.departmentId} not found`);
    }

    if (data.userId) {
      const existingUserFaculty = await this.prisma.faculty.findFirst({ where: { userId: data.userId, id: { not: id } } });
      if (existingUserFaculty) throw new BadRequestException(`User already linked to another faculty member`);
    }

    return this.prisma.faculty.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, email: true, role: true, lastLogin: true } },
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { subjects: true, assignments: true, marksUploads: true, attendanceSessions: true } }
      }
    });
  }

  async softDelete(id: number): Promise<Faculty> {
    await this.findOne(id);
    return this.prisma.faculty.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async restore(id: number): Promise<Faculty> {
    const faculty = await this.prisma.faculty.findFirst({ where: { id, deletedAt: { not: null } } });
    if (!faculty) throw new NotFoundException(`Deleted faculty with ID ${id} not found`);
    return this.prisma.faculty.update({ where: { id }, data: { deletedAt: null } });
  }

  async remove(id: number): Promise<Faculty> {
    await this.findOne(id);
    return this.prisma.faculty.delete({ where: { id } });
  }

  async findByDepartment(departmentId: number): Promise<Faculty[]> {
    return this.prisma.faculty.findMany({
      where: { departmentId, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, role: true, lastLogin: true } },
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { subjects: true, assignments: true, marksUploads: true, attendanceSessions: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findByEmail(email: string): Promise<Faculty> {
    const faculty = await this.prisma.faculty.findFirst({ where: { email, deletedAt: null } });
    if (!faculty) throw new NotFoundException(`Faculty with email ${email} not found`);
    return faculty;
  }

  async getFacultyAssignments(userId: number) {
    const faculty = await this.resolveFaculty(userId);
    return this.prisma.assignment.findMany({
      where: { facultyId: faculty.id, deletedAt: null },
      include: { subject: true, divisions: { include: { division: true } }, submissions: true },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async getFacultyNotices(userId: number) {
    const faculty = await this.resolveFaculty(userId);
    return this.prisma.notice.findMany({
      where: { OR: [{ isForFaculty: true }, { createdById: faculty.userId }] },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async getFacultyProfile(userId: number) {
    const faculty = await this.resolveFaculty(userId);
    return this.prisma.faculty.findUnique({ where: { id: faculty.id }, include: { user: { select: { id: true, email: true, role: true, lastLogin: true } }, department: true } });
  }

  async updateFacultyProfile(userId: number, updateData: any) {
    const faculty = await this.resolveFaculty(userId);
    return this.prisma.faculty.update({ where: { id: faculty.id }, data: updateData });
  }

  async getUserProfile(userId: number) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  async updateUserPassword(userId: number, newPassword: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { password: newPassword } });
  }
}
