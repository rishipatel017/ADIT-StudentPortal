import { Module } from '@nestjs/common';
import { AcademicCoreService } from '../academic/academic-core.service';
import { UserService } from '../users/user.service';
import { DepartmentService } from '../department/department.service';
import { SemesterService } from '../semester/semester.service';
import { SubjectService } from '../subject/subject.service';
import { StudentService } from '../modules/student/student.service';
import { FacultyService } from '../modules/faculty/faculty.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    AcademicCoreService,
    UserService,
    DepartmentService,
    SemesterService,
    SubjectService,
    StudentService,
    FacultyService
  ],
  exports: [
    AcademicCoreService,
    UserService,
    DepartmentService,
    SemesterService,
    SubjectService,
    StudentService,
    FacultyService
  ],
})
export class ServicesModule {}
