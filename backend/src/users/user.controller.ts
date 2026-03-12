import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Put, 
  Delete, 
  Param, 
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { UserService, CreateUserData, UpdateUserData } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
// Removed redundant CreateUserData, UpdateUserData import from old service

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async findAll(@Query('includeDeleted') includeDeleted?: string) {
    return this.userService.findAll();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getStats() {
    return this.userService.getUserStats();
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async findByRole(@Param('role') role: string) {
    try {
      return this.userService.findByRole(role as UserRole);
    } catch (error) {
      throw new BadRequestException('Invalid role specified');
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    return this.userService.findOne(userId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserData: CreateUserData) {
    try {
      return await this.userService.create(createUserData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserData: UpdateUserData) {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      return await this.userService.update(userId, updateUserData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    try {
      await this.userService.remove(userId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get(':id/reset-failed-attempts')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async resetFailedAttempts(@Param('id') id: string) {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.userService.resetFailedLogin(userId);
  }

  @Post(':id/lock')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async lockUser(@Param('id') id: string, @Body() body: { hours?: number }) {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const lockHours = body.hours || 24;
    const lockUntil = new Date(Date.now() + lockHours * 60 * 60 * 1000);

    return this.userService.update(userId, { 
      accountLockedUntil: lockUntil 
    });
  }

  @Post(':id/unlock')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async unlockUser(@Param('id') id: string) {
    const userId = parseInt(id);
    if (isNaN(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    return this.userService.update(userId, { 
      accountLockedUntil: null,
      failedLoginAttempts: 0 
    });
  }
}
