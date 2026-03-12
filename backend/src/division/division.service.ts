import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DivisionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.division.findMany({
      include: {
        semester: true,
        students: {
          select: { id: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.division.findUnique({
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
        },
      },
    });
  }
}
