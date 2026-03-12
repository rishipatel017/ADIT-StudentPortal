import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dtos/login.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        admin: true,
        faculty: true,
        student: true,
      },
    });

    if (!user) {
      return null;
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      throw new UnauthorizedException('Account is temporarily locked. Please try again later.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: user.failedLoginAttempts + 1,
          accountLockedUntil: user.failedLoginAttempts + 1 >= 5 
            ? new Date(Date.now() + 30 * 60 * 1000) // Lock for 30 minutes
            : null
        }
      });
      return null;
    }

    // Reset failed login attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        failedLoginAttempts: 0,
        accountLockedUntil: null
      }
    });

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (loginDto.role && user.role !== loginDto.role) {
      throw new UnauthorizedException('Role mismatch');
    }

    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role 
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Log activity
    await this.logActivity(user.id, 'login', 'user', user.id, 'User logged in');

    return {
      token: accessToken,
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: this.getUserName(user),
        lastLogin: user.lastLogin,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        role: registerDto.role,
      },
    });

    // Create role-specific profile
    switch (registerDto.role) {
      case UserRole.ADMIN:
        await this.prisma.admin.create({
          data: {
            userId: user.id,
            name: registerDto.name || 'Administrator',
          },
        });
        break;
      case UserRole.FACULTY:
        await this.prisma.faculty.create({
          data: {
            userId: user.id,
            name: registerDto.name || 'Faculty',
            email: registerDto.email,
            designation: registerDto.designation || 'Faculty',
            qualification: registerDto.qualification || 'To be updated',
            phone: registerDto.phone,
            joiningDate: new Date(),
            pastExperienceYears: registerDto.pastExperienceYears || 0,
            departmentId: registerDto.departmentId || 1, // Default department
          },
        });
        break;
      case UserRole.STUDENT:
        await this.prisma.student.create({
          data: {
            userId: user.id,
            name: registerDto.name || 'Student',
            enrollmentNo: registerDto.enrollmentNo || `IT${Date.now()}`,
            email: registerDto.email,
            divisionId: registerDto.divisionId || 1,
            semesterId: registerDto.semesterId || 1,
            departmentId: registerDto.departmentId || 1,
          },
        });
        break;
    }

    // Log activity
    await this.logActivity(user.id, 'register', 'user', user.id, 'New user registered');

    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role 
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: registerDto.name || this.getDefaultName(user.role),
      },
    };
  }

  async validateUserById(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        admin: true,
        faculty: true,
        student: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  async logout(userId: number) {
    await this.logActivity(userId, 'logout', 'user', userId, 'User logged out');
    return { message: 'Logged out successfully' };
  }

  async refreshToken(userId: number) {
    const user = await this.validateUserById(userId);
    
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role 
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetTokenExpiry,
      },
    });

    await this.logActivity(user.id, 'forgot_password', 'user', user.id, 'Password reset requested');

    // In a real application, send email here
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    });

    await this.logActivity(user.id, 'reset_password', 'user', user.id, 'Password reset completed');

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    await this.logActivity(userId, 'change_password', 'user', userId, 'Password changed');

    return { message: 'Password changed successfully' };
  }

  async updateProfile(userId: number, updateData: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        admin: true,
        faculty: true,
        student: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update user basic info
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: updateData.email,
      },
      include: {
        admin: true,
        faculty: true,
        student: true,
      },
    });

    // Update role-specific profile
    switch (user.role) {
      case UserRole.ADMIN:
        if (user.admin && updateData.name) {
          await this.prisma.admin.update({
            where: { id: user.admin.id },
            data: { name: updateData.name },
          });
        }
        break;
      case UserRole.FACULTY:
        if (user.faculty) {
          await this.prisma.faculty.update({
            where: { id: user.faculty.id },
            data: {
              name: updateData.name,
              phone: updateData.phone,
              qualification: updateData.qualification,
            },
          });
        }
        break;
      case UserRole.STUDENT:
        if (user.student) {
          await this.prisma.student.update({
            where: { id: user.student.id },
            data: {
              name: updateData.name,
            },
          });
        }
        break;
    }

    await this.logActivity(userId, 'update_profile', 'user', userId, 'Profile updated');

    return this.validateUserById(userId);
  }

  async checkSession(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        lastLogin: true,
        accountLockedUntil: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Session invalid');
    }

    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      throw new UnauthorizedException('Account is locked');
    }

    return { valid: true, user };
  }

  private getUserName(user: any): string {
    if (user.admin) return user.admin.name;
    if (user.faculty) return user.faculty.name;
    if (user.student) return user.student.name;
    return user.email;
  }

  private getDefaultName(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN: return 'Administrator';
      case UserRole.FACULTY: return 'Faculty';
      case UserRole.STUDENT: return 'Student';
      default: return 'User';
    }
  }

  private async logActivity(userId: number, action: string, entity: string, entityId: number, details: string) {
    try {
      await this.prisma.activityLog.create({
        data: {
          userId,
          action,
          entity,
          entityId,
          details,
        },
      });
    } catch (error) {
      // Log error but don't throw to avoid breaking main functionality
      console.error('Failed to log activity:', error);
    }
  }
}
