import { Controller, Get, Param, UseGuards, Request, Post, Put, Body } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get('assignments')
  async getFacultyAssignments(@Request() req) {
    return this.facultyService.getFacultyAssignments(req.user.id);
  }

  @Get('notices')
  async getFacultyNotices(@Request() req) {
    return this.facultyService.getFacultyNotices(req.user.id);
  }

  // Profile Management
  @Get('profile')
  async getFacultyProfile(@Request() req) {
    return this.facultyService.getFacultyProfile(req.user.id);
  }

  @Put('profile')
  async updateFacultyProfile(@Request() req, @Body() updateData: any) {
    return this.facultyService.updateFacultyProfile(req.user.id, updateData);
  }

  @Get('profile/:userId')
  async getUserProfile(@Param('userId') userId: string) {
    return this.facultyService.getUserProfile(parseInt(userId));
  }

  @Post('change-password/:userId')
  async updateUserPassword(
    @Param('userId') userId: string,
    @Body() body: { newPassword: string }
  ) {
    return this.facultyService.updateUserPassword(parseInt(userId), body.newPassword);
  }

  @Get()
  async findAll() {
    return this.facultyService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.facultyService.findOne(parseInt(id));
  }
}
