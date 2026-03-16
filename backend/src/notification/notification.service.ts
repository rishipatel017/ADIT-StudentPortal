import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dtos/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        title: dto.title,
        message: dto.message,
        type: dto.type as any, // mapping between enum and prisma enum
        userId: dto.userId,
        departmentId: dto.departmentId,
        semesterId: dto.semesterId,
        divisionId: dto.divisionId,
        isForFaculty: dto.isForFaculty ?? false,
        isForStudents: dto.isForStudents ?? true,
      }
    });
  }

  async getMyNotifications(userId: number, role: string, filters: { departmentId?: number; semesterId?: number; divisionId?: number }) {
    const isFaculty = role === 'FACULTY';
    const isStudent = role === 'STUDENT';
    const isAdmin = role === 'ADMIN';

    if (isAdmin) {
      return this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100
      });
    }

    const baseQuery: any = {
      OR: [
        { userId },
        {
          AND: [
            { userId: null },
            {
              OR: [
                { AND: [{ departmentId: null }, { semesterId: null }, { divisionId: null }] }, // Global
                {
                  departmentId: filters.departmentId || null,
                  AND: [
                    { OR: [{ semesterId: null }, { semesterId: filters.semesterId || null }] },
                    { OR: [{ divisionId: null }, { divisionId: filters.divisionId || null }] }
                  ]
                }
              ]
            },
            isFaculty ? { isForFaculty: true } : {},
            isStudent ? { isForStudents: true } : {}
          ]
        }
      ]
    };

    return this.prisma.notification.findMany({
      where: baseQuery,
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  async markAsRead(notificationId: number) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  async deleteAll(userId: number) {
    return this.prisma.notification.deleteMany({
      where: { userId }
    });
  }
}
