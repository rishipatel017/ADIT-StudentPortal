import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

export interface CreateUserData {
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  role?: UserRole;
  lastLogin?: Date;
  failedLoginAttempts?: number;
  accountLockedUntil?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserData): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new BadRequestException(`User with email ${data.email} already exists`);

    return this.prisma.user.create({
      data,
      include: { student: true, faculty: true, admin: true }
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: { student: true, faculty: true, admin: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        student: true, faculty: true, admin: true,
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
        apiTokens: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { student: true, faculty: true, admin: true }
    });

    if (!user) throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  async update(id: number, data: UpdateUserData): Promise<User> {
    await this.findOne(id);
    if (data.email) {
      const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser && existingUser.id !== id) throw new BadRequestException(`Email ${data.email} is already taken`);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      include: { student: true, faculty: true, admin: true }
    });
  }

  async remove(id: number): Promise<User> {
    await this.findOne(id);
    return this.prisma.user.delete({
      where: { id },
      include: { student: true, faculty: true, admin: true }
    });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { role },
      include: { student: true, faculty: true, admin: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateLastLogin(id: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date(), failedLoginAttempts: 0, accountLockedUntil: null }
    });
  }

  async incrementFailedLogin(id: number): Promise<User> {
    const user = await this.findOne(id);
    const failedAttempts = user.failedLoginAttempts + 1;
    const accountLockedUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;

    return this.prisma.user.update({
      where: { id },
      data: { failedLoginAttempts: failedAttempts, accountLockedUntil }
    });
  }

  async resetFailedLogin(id: number): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { failedLoginAttempts: 0, accountLockedUntil: null }
    });
  }

  async createPasswordResetToken(email: string): Promise<string> {
    const user = await this.findByEmail(email);
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires }
    });

    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } }
    });

    if (!user) throw new BadRequestException('Invalid or expired reset token');

    return this.prisma.user.update({
      where: { id: user.id },
      data: { password: newPassword, passwordResetToken: null, passwordResetExpires: null, failedLoginAttempts: 0, accountLockedUntil: null }
    });
  }

  async getUserStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [total, admins, faculty, students, activeToday, lockedAccounts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'FACULTY' } }),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.user.count({ where: { lastLogin: { gte: today } } }),
      this.prisma.user.count({ where: { accountLockedUntil: { gt: now } } })
    ]);

    return { total, admins, faculty, students, activeToday, lockedAccounts };
  }
}
