import { 
  Controller, 
  Get, 
  Param, 
  UseGuards, 
  Request, 
  Post, 
  Put, 
  Body,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { StudentService, CreateStudentData, UpdateStudentData } from './student.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
// Removed redundant CreateStudentData, UpdateStudentData import from old service

@UseGuards(JwtAuthGuard)
@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('assignments')
  async getStudentAssignments(@Request() req) {
    return this.studentService.getStudentAssignments(req.user.id);
  }

  @Get('notices')
  async getStudentNotices(@Request() req) {
    return this.studentService.getStudentNotices(req.user.id);
  }

  @Get('attendance')
  async getStudentAttendance(@Request() req) {
    return this.studentService.getStudentAttendance(req.user.id);
  }

  @Get('marks')
  async getStudentMarks(@Request() req) {
    return this.studentService.getStudentMarks(req.user.id);
  }

  // Profile Management
  @Get('profile')
  async getStudentProfile(@Request() req) {
    return this.studentService.getStudentProfile(req.user.id);
  }

  @Put('profile')
  async updateStudentProfile(@Request() req, @Body() updateData: any) {
    return this.studentService.updateStudentProfile(req.user.id, updateData);
  }

  @Get('profile/:userId')
  async getUserProfile(@Param('userId') userId: string) {
    return this.studentService.getUserProfile(parseInt(userId));
  }

  @Post('change-password/:userId')
  async updateUserPassword(
    @Param('userId') userId: string,
    @Body() body: { newPassword: string }
  ) {
    return this.studentService.updateUserPassword(parseInt(userId), body.newPassword);
  }

  // CRUD Operations with proper authentication
  @Get()
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async findAll(@Query('includeDeleted') includeDeleted?: string) {
    return this.studentService.findAll(includeDeleted === 'true');
  }

  @Get('department/:departmentId')
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async findByDepartment(@Param('departmentId') departmentId: string) {
    const deptId = parseInt(departmentId);
    if (isNaN(deptId)) {
      throw new BadRequestException('Invalid department ID');
    }
    return this.studentService.findByDepartment(deptId);
  }

  @Get('division/:divisionId')
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async findByDivision(@Param('divisionId') divisionId: string) {
    const divId = parseInt(divisionId);
    if (isNaN(divId)) {
      throw new BadRequestException('Invalid division ID');
    }
    return this.studentService.findByDivision(divId);
  }

  @Get('semester/:semesterId')
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async findBySemester(@Param('semesterId') semesterId: string) {
    const semId = parseInt(semesterId);
    if (isNaN(semId)) {
      throw new BadRequestException('Invalid semester ID');
    }
    return this.studentService.findBySemester(semId);
  }

  @Get('enrollment/:enrollmentNo')
  async findByEnrollmentNo(@Param('enrollmentNo') enrollmentNo: string) {
    return this.studentService.findByEnrollmentNo(enrollmentNo);
  }

  @Get('performance')
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async getStudentsWithPerformanceData(
    @Query('divisionId') divisionId?: string,
    @Query('semesterId') semesterId?: string
  ) {
    const divId = divisionId ? parseInt(divisionId) : undefined;
    const semId = semesterId ? parseInt(semesterId) : undefined;

    if (divisionId && isNaN(divId!)) {
      throw new BadRequestException('Invalid division ID');
    }
    if (semesterId && isNaN(semId!)) {
      throw new BadRequestException('Invalid semester ID');
    }

    return this.studentService.getStudentsWithPerformanceData(divId, semId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }
    return this.studentService.findOne(studentId);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }
    return this.studentService.getStudentStats(studentId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createStudentData: CreateStudentData) {
    try {
      return await this.studentService.create(createStudentData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateStudentData: UpdateStudentData) {
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    try {
      return await this.studentService.update(studentId, updateStudentData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    try {
      await this.studentService.remove(studentId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Delete(':id/soft')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async softDelete(@Param('id') id: string) {
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    try {
      return await this.studentService.softDeleteStudent(studentId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post(':id/restore')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string) {
    const studentId = parseInt(id);
    if (isNaN(studentId)) {
      throw new BadRequestException('Invalid student ID');
    }

    try {
      return await this.studentService.restoreStudent(studentId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post('batch')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBatch(@Body() body: { students: CreateStudentData[] }) {
    try {
      const results = [];
      for (const studentData of body.students) {
        try {
          const student = await this.studentService.create(studentData);
          results.push({ success: true, student });
        } catch (error) {
          results.push({ success: false, error: error.message, data: studentData });
        }
      }
      return { results, total: body.students.length, successful: results.filter(r => r.success).length };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
