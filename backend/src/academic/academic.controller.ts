import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AcademicCoreService } from './academic-core.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@ApiTags('academic')
@Controller('academic')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AcademicController {
  constructor(private readonly academicService: AcademicCoreService) {}

  @Get('semesters')
  @ApiOperation({ summary: 'Get all semesters' })
  @ApiResponse({ status: 200, description: 'List of all semesters' })
  async getSemesters() {
    return this.academicService.getSemesters();
  }

  @Get('divisions')
  @ApiOperation({ summary: 'Get divisions by semester' })
  @ApiResponse({ status: 200, description: 'List of divisions for a semester' })
  async getDivisions(@Query('semesterId') semesterId: string) {
    if (!semesterId) {
      throw new BadRequestException('Semester ID is required');
    }
    return this.academicService.getDivisions(parseInt(semesterId));
  }

  @Get('subjects')
  @ApiOperation({ summary: 'Get subjects by semester' })
  @ApiResponse({ status: 200, description: 'List of subjects for a semester' })
  async getSubjects(@Query('semesterId') semesterId: string) {
    if (!semesterId) {
      throw new BadRequestException('Semester ID is required');
    }
    return this.academicService.getSubjects(parseInt(semesterId));
  }

  @Get('faculty-subjects')
  @ApiOperation({ summary: 'Get subjects assigned to faculty' })
  @ApiResponse({ status: 200, description: 'List of subjects assigned to the faculty' })
  async getFacultySubjects(@GetUser() user: User) {
    if (user.role !== 'FACULTY') {
      throw new BadRequestException('Only faculty can access their assigned subjects');
    }
    return this.academicService.getFacultySubjects(user.id);
  }

  @Get('students')
  @ApiOperation({ summary: 'Get students by division and semester' })
  @ApiResponse({ status: 200, description: 'List of students for a division and semester' })
  async getStudents(
    @Query('semesterId') semesterId: string,
    @Query('divisionId') divisionId: string,
  ) {
    if (!semesterId || !divisionId) {
      throw new BadRequestException('Both semester ID and division ID are required');
    }
    return this.academicService.getStudents(parseInt(semesterId), parseInt(divisionId));
  }

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics based on user role' })
  async getDashboardStats(@GetUser() user: User) {
    return this.academicService.getDashboardStats(user);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search academic data' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchAcademicData(
    @Query('type') type: string,
    @Query('query') query: string,
    @Query('semesterId') semesterId?: string,
  ) {
    if (!type || !query) {
      throw new BadRequestException('Type and query are required');
    }
    return this.academicService.searchAcademicData(type, query, semesterId ? parseInt(semesterId) : undefined);
  }
}
