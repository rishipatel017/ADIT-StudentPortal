import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicCoreService, StudentContext } from '../academic/academic-core.service';
import { CreateNoticeDto } from './dtos/create-notice.dto';
import { UpdateNoticeDto } from './dtos/update-notice.dto';
import { NotificationService } from '../notification/notification.service';

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
export class NoticesService {
  constructor(
    private prisma: PrismaService,
    private academicContext: AcademicCoreService,
    private notificationService: NotificationService
  ) {}

  async createNotice(userId: number, userRole: string, createNoticeDto: CreateNoticeDto, file?: MulterFile) {
    const { title, content, semester, divisionId, isForFaculty, isForStudents } = createNoticeDto;

    // If targeting specific division, validate it exists
    if (divisionId && semester) {
      try {
        await this.academicContext.loadAcademicContext(semester, 1, divisionId); // subjectId not needed for validation
      } catch (error) {
        throw new BadRequestException('Invalid semester or division combination');
      }
    }

    const notice = await this.prisma.notice.create({
      data: {
        title,
        content,
        attachment: file ? `uploads/notices/${file.filename}` : null,
        createdById: userId,
        createdByRole: userRole as 'ADMIN' | 'FACULTY',
        semesterId: semester || null,
        divisionId: divisionId || null,
        isForFaculty: isForFaculty || false,
        isForStudents: isForStudents !== false, // Default to true
      },
    });

    await this.notificationService.createNotification({
      title: 'New Notice',
      message: title,
      type: 'NOTICE' as any,
      semesterId: semester || null,
      divisionId: divisionId || null,
      isForFaculty: isForFaculty || false,
      isForStudents: isForStudents !== false, // Default to true
    });

    return notice;
  }

  async getStudentNotices(studentId: number) {
    // Load student context for unified data
    const studentContext: StudentContext = await this.academicContext.loadStudentContext(studentId);

    const notices = await this.prisma.notice.findMany({
      where: {
        isForStudents: true,
        AND: [
          {
            OR: [
              { semesterId: null },
              { semesterId: studentContext.semester.id },
            ],
          },
          {
            OR: [
              { divisionId: null },
              { divisionId: studentContext.division.id },
            ],
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notices;
  }

  async getFacultyNotices(facultyId: number) {
    const notices = await this.prisma.notice.findMany({
      where: {
        OR: [
          { isForFaculty: true },
          { createdById: facultyId, createdByRole: 'FACULTY' },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notices;
  }

  async getAllNotices(userId: number, userRole: string) {
    let whereClause: any = {};

    // Admin can see all notices
    if (userRole === 'ADMIN') {
      // No filtering for admin
    } 
    // Faculty can see faculty notices and their own notices
    else if (userRole === 'FACULTY') {
      whereClause = {
        OR: [
          { isForFaculty: true },
          { createdById: userId, createdByRole: 'FACULTY' },
        ],
      };
    } 
    // Student notices are handled by getStudentNotices
    else {
      throw new Error('Invalid role for this operation');
    }

    const notices = await this.prisma.notice.findMany({
      where: whereClause,
      include: {
        division: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notices.map(notice => ({
      ...notice,
      canEdit: this.canEditNotice(notice, userId, userRole),
      canDelete: this.canDeleteNotice(notice, userId, userRole),
    }));
  }

  async getNoticeById(noticeId: number, userId: number, userRole: string) {
    const notice = await this.prisma.notice.findUnique({
      where: { id: noticeId },
      include: {
        division: true,
      },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    // Check if user has permission to view this notice
    if (!this.canViewNotice(notice, userId, userRole)) {
      throw new BadRequestException('Access denied');
    }

    return {
      ...notice,
      canEdit: this.canEditNotice(notice, userId, userRole),
      canDelete: this.canDeleteNotice(notice, userId, userRole),
    };
  }

  async updateNotice(noticeId: number, userId: number, userRole: string, updateNoticeDto: UpdateNoticeDto) {
    const notice = await this.prisma.notice.findUnique({
      where: { id: noticeId },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    if (!this.canEditNotice(notice, userId, userRole)) {
      throw new BadRequestException('You can only edit your own notices');
    }

    const updatedNotice = await this.prisma.notice.update({
      where: { id: noticeId },
      data: {
        title: updateNoticeDto.title,
        content: updateNoticeDto.content,
        semesterId: updateNoticeDto.semester || undefined,
        divisionId: updateNoticeDto.divisionId || undefined,
        isForFaculty: updateNoticeDto.isForFaculty,
        isForStudents: updateNoticeDto.isForStudents,
        updatedAt: new Date(),
      },
    });

    return updatedNotice;
  }

  async deleteNotice(noticeId: number, userId: number, userRole: string) {
    const notice = await this.prisma.notice.findUnique({
      where: { id: noticeId },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found');
    }

    if (!this.canDeleteNotice(notice, userId, userRole)) {
      throw new BadRequestException('You can only delete your own notices');
    }

    await this.prisma.notice.delete({
      where: { id: noticeId },
    });

    return { message: 'Notice deleted successfully' };
  }

  async getNoticesByTarget(filters: {
    semester?: number;
    divisionId?: number;
    isForFaculty?: boolean;
    isForStudents?: boolean;
  }) {
    const whereClause: any = {};

    if (filters.semester !== undefined) {
      whereClause.semester = filters.semester;
    }
    if (filters.divisionId !== undefined) {
      whereClause.divisionId = filters.divisionId;
    }
    if (filters.isForFaculty !== undefined) {
      whereClause.isForFaculty = filters.isForFaculty;
    }
    if (filters.isForStudents !== undefined) {
      whereClause.isForStudents = filters.isForStudents;
    }

    const notices = await this.prisma.notice.findMany({
      where: whereClause,
      include: {
        division: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notices;
  }

  async getNoticeStatistics(userId: number, userRole: string) {
    let whereClause: any = {};

    // Different statistics based on role
    if (userRole === 'ADMIN') {
      // Admin sees all statistics
    } else if (userRole === 'FACULTY') {
      // Faculty sees their own and faculty-targeted notices
      whereClause = {
        OR: [
          { isForFaculty: true },
          { createdById: userId, createdByRole: 'FACULTY' },
        ],
      };
    } else {
      throw new Error('Invalid role for statistics');
    }

    const totalNotices = await this.prisma.notice.count({
      where: whereClause,
    });

    const studentNotices = await this.prisma.notice.count({
      where: {
        ...whereClause,
        isForStudents: true,
      },
    });

    const facultyNotices = await this.prisma.notice.count({
      where: {
        ...whereClause,
        isForFaculty: true,
      },
    });

    const recentNotices = await this.prisma.notice.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    return {
      totalNotices,
      studentNotices,
      facultyNotices,
      recentNotices,
    };
  }

  private canViewNotice(notice: any, userId: number, userRole: string): boolean {
    // Admin can view all notices
    if (userRole === 'ADMIN') return true;

    // Faculty can view faculty notices and their own notices
    if (userRole === 'FACULTY') {
      return notice.isForFaculty || (notice.createdById === userId && notice.createdByRole === 'FACULTY');
    }

    // Student viewing is handled by getStudentNotices
    return false;
  }

  private canEditNotice(notice: any, userId: number, userRole: string): boolean {
    // Admin can edit any notice
    if (userRole === 'ADMIN') return true;

    // Faculty can only edit their own notices
    if (userRole === 'FACULTY') {
      return notice.createdById === userId && notice.createdByRole === 'FACULTY';
    }

    // Students cannot edit notices
    return false;
  }

  private canDeleteNotice(notice: any, userId: number, userRole: string): boolean {
    // Admin can delete any notice
    if (userRole === 'ADMIN') return true;

    // Faculty can only delete their own notices
    if (userRole === 'FACULTY') {
      return notice.createdById === userId && notice.createdByRole === 'FACULTY';
    }

    // Students cannot delete notices
    return false;
  }
}
