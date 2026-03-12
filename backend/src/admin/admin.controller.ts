import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateStudentDto, UpdateStudentDto } from './dtos/student.dto';
import { CreateFacultyDto, UpdateFacultyDto } from './dtos/faculty.dto';
import { CreateSubjectDto, UpdateSubjectDto } from './dtos/subject.dto';
import { CreateSemesterDto, UpdateSemesterDto } from './dtos/semester.dto';
import { CreateDivisionDto, UpdateDivisionDto } from './dtos/division.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Dashboard Statistics
  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // Student Management
  @Get('students')
  async getAllStudents() {
    return this.adminService.getAllStudents();
  }

  @Get('students/:id')
  async getStudentById(@Param('id') id: string) {
    return this.adminService.getStudentById(parseInt(id));
  }

  @Post('students')
  async createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.adminService.createStudent(createStudentDto);
  }

  @Put('students/:id')
  async updateStudent(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.adminService.updateStudent(parseInt(id), updateStudentDto);
  }

  @Delete('students/:id')
  async deleteStudent(@Param('id') id: string) {
    return this.adminService.deleteStudent(parseInt(id));
  }

  // Faculty Management
  @Get('faculty')
  async getAllFaculty() {
    return this.adminService.getAllFaculty();
  }

  @Get('faculty/:id')
  async getFacultyById(@Param('id') id: string) {
    return this.adminService.getFacultyById(parseInt(id));
  }

  @Post('faculty')
  async createFaculty(@Body() createFacultyDto: CreateFacultyDto) {
    return this.adminService.createFaculty(createFacultyDto);
  }

  @Put('faculty/:id')
  async updateFaculty(
    @Param('id') id: string,
    @Body() updateFacultyDto: UpdateFacultyDto,
  ) {
    return this.adminService.updateFaculty(parseInt(id), updateFacultyDto);
  }

  @Delete('faculty/:id')
  async deleteFaculty(@Param('id') id: string) {
    return this.adminService.deleteFaculty(parseInt(id));
  }

  // Semester Management
  @Get('semesters')
  async getAllSemesters() {
    return this.adminService.getAllSemesters();
  }

  @Get('semesters/:id')
  async getSemesterById(@Param('id') id: string) {
    return this.adminService.getSemesterById(parseInt(id));
  }

  @Post('semesters')
  async createSemester(@Body() createSemesterDto: CreateSemesterDto) {
    return this.adminService.createSemester(createSemesterDto);
  }

  @Put('semesters/:id')
  async updateSemester(
    @Param('id') id: string,
    @Body() updateSemesterDto: UpdateSemesterDto,
  ) {
    return this.adminService.updateSemester(parseInt(id), updateSemesterDto);
  }

  @Delete('semesters/:id')
  async deleteSemester(@Param('id') id: string) {
    return this.adminService.deleteSemester(parseInt(id));
  }

  // Division Management
  @Get('divisions')
  async getAllDivisions() {
    return this.adminService.getAllDivisions();
  }

  @Get('divisions/:id')
  async getDivisionById(@Param('id') id: string) {
    return this.adminService.getDivisionById(parseInt(id));
  }

  @Post('divisions')
  async createDivision(@Body() createDivisionDto: CreateDivisionDto) {
    return this.adminService.createDivision(createDivisionDto);
  }

  @Put('divisions/:id')
  async updateDivision(
    @Param('id') id: string,
    @Body() updateDivisionDto: UpdateDivisionDto,
  ) {
    return this.adminService.updateDivision(parseInt(id), updateDivisionDto);
  }

  @Delete('divisions/:id')
  async deleteDivision(@Param('id') id: string) {
    return this.adminService.deleteDivision(parseInt(id));
  }

  // Subject Management
  @Get('subjects')
  async getAllSubjects() {
    return this.adminService.getAllSubjects();
  }

  @Get('subjects/:id')
  async getSubjectById(@Param('id') id: string) {
    return this.adminService.getSubjectById(parseInt(id));
  }

  @Post('subjects')
  async createSubject(@Body() createSubjectDto: CreateSubjectDto) {
    return this.adminService.createSubject(createSubjectDto);
  }

  @Put('subjects/:id')
  async updateSubject(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.adminService.updateSubject(parseInt(id), updateSubjectDto);
  }

  @Delete('subjects/:id')
  async deleteSubject(@Param('id') id: string) {
    return this.adminService.deleteSubject(parseInt(id));
  }

  // Search functionality
  @Get('search')
  async searchAcademicData(
    @Query('type') type: 'students' | 'subjects' | 'faculty',
    @Query('query') query: string,
    @Query('semesterId') semesterId?: number,
  ) {
    return this.adminService.searchAcademicData(type, query, semesterId);
  }

  // Profile Management
  @Get('profile')
  async getAdminProfile(@Request() req) {
    return this.adminService.getAdminProfile(req.user.id);
  }

  @Put('profile')
  async updateAdminProfile(@Request() req, @Body() updateData: any) {
    return this.adminService.updateAdminProfile(req.user.id, updateData);
  }

  @Get('profile/:userId')
  async getUserProfile(@Param('userId') userId: string) {
    return this.adminService.getUserProfile(parseInt(userId));
  }

  @Post('change-password/:userId')
  async updateUserPassword(
    @Param('userId') userId: string,
    @Body() body: { newPassword: string }
  ) {
    return this.adminService.updateUserPassword(parseInt(userId), body.newPassword);
  }

  @Get('faculty-subjects')
  async getFacultySubjectAssignments(
    @Query('semesterId') semesterId?: string,
    @Query('facultyId') facultyId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('divisionId') divisionId?: string,
  ) {
    return this.adminService.getFacultySubjectAssignments({
      semesterId: semesterId ? parseInt(semesterId) : undefined,
      facultyId: facultyId ? parseInt(facultyId) : undefined,
      subjectId: subjectId ? parseInt(subjectId) : undefined,
      divisionId: divisionId ? parseInt(divisionId) : undefined,
    });
  }

  @Post('faculty-subjects')
  async assignFacultyToSubject(@Body() body: { facultyId: number; subjectId: number; divisionId: number }) {
    return this.adminService.assignFacultyToSubject(body);
  }

  @Delete('faculty-subjects')
  async unassignFacultyFromSubject(
    @Query('facultyId') facultyId: string,
    @Query('subjectId') subjectId: string,
    @Query('divisionId') divisionId: string,
  ) {
    return this.adminService.unassignFacultyFromSubject({
      facultyId: parseInt(facultyId),
      subjectId: parseInt(subjectId),
      divisionId: parseInt(divisionId),
    });
  }

  @Get('promotion/preview')
  async previewPromotion(@Query('fromSemesterId') fromSemesterId: string) {
    return this.adminService.previewPromotion(parseInt(fromSemesterId));
  }

  @Post('promotion/execute')
  async executePromotion(@Body() body: { fromSemesterId: number }) {
    return this.adminService.executePromotion(body.fromSemesterId);
  }
}
