import { Controller, Get, Post, Body, Param, UseGuards, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getMyNotifications(
    @GetUser() user: any,
    @Query('departmentId') departmentId?: string,
    @Query('semesterId') semesterId?: string,
    @Query('divisionId') divisionId?: string,
  ) {
    const filters = {
      departmentId: departmentId ? parseInt(departmentId, 10) : undefined,
      semesterId: semesterId ? parseInt(semesterId, 10) : undefined,
      divisionId: divisionId ? parseInt(divisionId, 10) : undefined,
    };
    return this.notificationService.getMyNotifications(user.id, user.role, filters);
  }

  @Post(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(id);
  }

  @Post('read-all')
  async markAllAsRead(@GetUser() user: any) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Post('clear-all')
  async deleteAll(@GetUser() user: any) {
    return this.notificationService.deleteAll(user.id);
  }
}
