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
import { SemesterService, CreateSemesterData, UpdateSemesterData } from './semester.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
// Removed redundant CreateSemesterData, UpdateSemesterData import from old service

@UseGuards(JwtAuthGuard)
@Controller('semesters')
export class SemesterController {
  constructor(private readonly semesterService: SemesterService) {}

  @Get()
  async findAll(
    @Query('departmentId') departmentId?: string,
    @Query('includeDeleted') includeDeleted?: string
  ) {
    return this.semesterService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const semesterId = parseInt(id);
    if (isNaN(semesterId)) {
      throw new BadRequestException('Invalid semester ID');
    }
    return this.semesterService.findOne(semesterId);
  }

  @Get(':id/stats')
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async getStats(@Param('id') id: string) {
    const semesterId = parseInt(id);
    if (isNaN(semesterId)) {
      throw new BadRequestException('Invalid semester ID');
    }
    return this.semesterService.getSemesterStats(semesterId);
  }

  @Get(':id/subjects')
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async getSubjects(@Param('id') id: string) {
    const semesterId = parseInt(id);
    if (isNaN(semesterId)) {
      throw new BadRequestException('Invalid semester ID');
    }
    return this.semesterService.getSemesterSubjects(semesterId);
  }

  @Get(':id/divisions')
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async getDivisions(@Param('id') id: string) {
    const semesterId = parseInt(id);
    if (isNaN(semesterId)) {
      throw new BadRequestException('Invalid semester ID');
    }
    return this.semesterService.getSemesterDivisions(semesterId);
  }

  @Get(':id/students')
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async getStudents(@Param('id') id: string) {
    const semesterId = parseInt(id);
    if (isNaN(semesterId)) {
      throw new BadRequestException('Invalid semester ID');
    }
    return this.semesterService.getSemesterStudents(semesterId);
  }

  @Get(':id/assignments')
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async getAssignments(@Param('id') id: string) {
    const semesterId = parseInt(id);
    if (isNaN(semesterId)) {
      throw new BadRequestException('Invalid semester ID');
    }
    return this.semesterService.getSemesterAssignments(semesterId);
  }

  @Get(':id/marks')
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async getMarks(@Param('id') id: string) {
    const semesterId = parseInt(id);
    if (isNaN(semesterId)) {
      throw new BadRequestException('Invalid semester ID');
    }
    return this.semesterService.getSemesterMarks(semesterId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createSemesterData: CreateSemesterData) {
    try {
      return await this.semesterService.create(createSemesterData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async update(
    @Param('id') id: string, 
    @Body() updateSemesterData: UpdateSemesterData
  ) {
    const semesterId = parseInt(id);
    if (isNaN(semesterId)) {
      throw new BadRequestException('Invalid semester ID');
    }

    try {
      return await this.semesterService.update(semesterId, updateSemesterData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const semesterId = parseInt(id);
    if (isNaN(semesterId)) {
      throw new BadRequestException('Invalid semester ID');
    }

    try {
      await this.semesterService.remove(semesterId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Delete(':id/soft')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async softDelete(@Param('id') id: string) {
    const semesterId = parseInt(id);
    if (isNaN(semesterId)) {
      throw new BadRequestException('Invalid semester ID');
    }

    try {
      return await this.semesterService.softDeleteSemester(semesterId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post(':id/restore')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string) {
    const semesterId = parseInt(id);
    if (isNaN(semesterId)) {
      throw new BadRequestException('Invalid semester ID');
    }

    try {
      return await this.semesterService.restoreSemester(semesterId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('reports/summary')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getSemestersSummary() {
    return this.semesterService.getSemestersSummary();
  }

  @Get('reports/performance')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getSemestersPerformance() {
    return this.semesterService.getSemestersPerformance();
  }
}
