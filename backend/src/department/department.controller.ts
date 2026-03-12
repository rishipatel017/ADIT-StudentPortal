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
import { DepartmentService, CreateDepartmentData, UpdateDepartmentData } from './department.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';
// Removed redundant CreateDepartmentData, UpdateDepartmentData import from old service

@Controller('departments')
@UseGuards(JwtAuthGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async findAll(@Query('includeDeleted') includeDeleted?: string) {
    return this.departmentService.findAll(includeDeleted === 'true');
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async findOne(@Param('id') id: string) {
    const deptId = parseInt(id);
    if (isNaN(deptId)) {
      throw new BadRequestException('Invalid department ID');
    }
    return this.departmentService.findOne(deptId);
  }

  @Get(':id/stats')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getStats(@Param('id') id: string) {
    const deptId = parseInt(id);
    if (isNaN(deptId)) {
      throw new BadRequestException('Invalid department ID');
    }
    return this.departmentService.getDepartmentStats(deptId);
  }

  @Get(':id/semesters')
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async getSemesters(@Param('id') id: string) {
    const deptId = parseInt(id);
    if (isNaN(deptId)) {
      throw new BadRequestException('Invalid department ID');
    }
    return this.departmentService.getDepartmentSemesters(deptId);
  }

  @Get(':id/faculty')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getFaculty(@Param('id') id: string) {
    const deptId = parseInt(id);
    if (isNaN(deptId)) {
      throw new BadRequestException('Invalid department ID');
    }
    return this.departmentService.getDepartmentFaculty(deptId);
  }

  @Get(':id/students')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getStudents(@Param('id') id: string) {
    const deptId = parseInt(id);
    if (isNaN(deptId)) {
      throw new BadRequestException('Invalid department ID');
    }
    return this.departmentService.getDepartmentStudents(deptId);
  }

  @Get(':id/subjects')
  @Roles(UserRole.ADMIN, UserRole.FACULTY)
  @UseGuards(RolesGuard)
  async getSubjects(@Param('id') id: string) {
    const deptId = parseInt(id);
    if (isNaN(deptId)) {
      throw new BadRequestException('Invalid department ID');
    }
    return this.departmentService.getDepartmentSubjects(deptId);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDepartmentData: CreateDepartmentData) {
    try {
      return await this.departmentService.create(createDepartmentData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async update(
    @Param('id') id: string, 
    @Body() updateDepartmentData: UpdateDepartmentData
  ) {
    const deptId = parseInt(id);
    if (isNaN(deptId)) {
      throw new BadRequestException('Invalid department ID');
    }

    try {
      return await this.departmentService.update(deptId, updateDepartmentData);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const deptId = parseInt(id);
    if (isNaN(deptId)) {
      throw new BadRequestException('Invalid department ID');
    }

    try {
      await this.departmentService.remove(deptId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Delete(':id/soft')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async softDelete(@Param('id') id: string) {
    const deptId = parseInt(id);
    if (isNaN(deptId)) {
      throw new BadRequestException('Invalid department ID');
    }

    try {
      return await this.departmentService.softDeleteDepartment(deptId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Post(':id/restore')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id') id: string) {
    const deptId = parseInt(id);
    if (isNaN(deptId)) {
      throw new BadRequestException('Invalid department ID');
    }

    try {
      return await this.departmentService.restoreDepartment(deptId);
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('reports/summary')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getDepartmentsSummary() {
    return this.departmentService.getDepartmentsSummary();
  }

  @Get('reports/performance')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getDepartmentsPerformance() {
    return this.departmentService.getDepartmentsPerformance();
  }
}
