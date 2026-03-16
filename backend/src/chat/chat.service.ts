import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dtos/send-message.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
  ) {}

  async sendMessage(userId: number, role: any, dto: SendMessageDto) {
    const message = await this.prisma.chatMessage.create({
      data: {
        message: dto.message,
        senderId: userId,
        senderRole: role,
        departmentId: dto.departmentId || null,
        semesterId: dto.semesterId || null,
        divisionId: dto.divisionId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            student: { select: { name: true } },
            faculty: { select: { name: true } },
            admin: { select: { name: true } }
          }
        }
      }
    });

    // Notify others in the chat scope
    await this.notificationService.createNotification({
      title: 'New Chat Message',
      message: dto.message,
      type: 'CHAT' as any,
      departmentId: dto.departmentId,
      semesterId: dto.semesterId,
      divisionId: dto.divisionId,
      isForFaculty: true,
      isForStudents: true,
    });

    return message;
  }

  async getMessages(role: string, filters: { departmentId?: number; semesterId?: number; divisionId?: number; skip?: number; limit?: number }) {
    const isAdmin = role === 'ADMIN';
    const whereClause: any = {
      AND: [
        {
          OR: [
            { departmentId: null },
            filters.departmentId ? { departmentId: Number(filters.departmentId) } : {},
            isAdmin ? { NOT: { departmentId: undefined } } : {}
          ].filter(obj => Object.keys(obj).length > 0),
        },
        {
          OR: [
            { semesterId: null },
            filters.semesterId ? { semesterId: Number(filters.semesterId) } : {},
            isAdmin ? { NOT: { semesterId: undefined } } : {}
          ].filter(obj => Object.keys(obj).length > 0),
        },
        {
          OR: [
            { divisionId: null },
            filters.divisionId ? { divisionId: Number(filters.divisionId) } : {},
            isAdmin ? { NOT: { divisionId: undefined } } : {}
          ].filter(obj => Object.keys(obj).length > 0),
        },
      ].filter(condition => {
        if (condition.OR && condition.OR.length === 0) return false;
        return true;
      }),
    };

    // If Admin and no filters provided, show all
    if (isAdmin && !filters.departmentId && !filters.semesterId && !filters.divisionId) {
      delete whereClause.AND;
      whereClause.id = { not: 0 }; 
    }

    return this.prisma.chatMessage.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            student: { select: { name: true } },
            faculty: { select: { name: true } },
            admin: { select: { name: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: filters.skip ? Number(filters.skip) : 0,
      take: filters.limit ? Number(filters.limit) : 50,
    });
  }
}
