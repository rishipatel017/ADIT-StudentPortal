import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ServicesModule } from './services/services.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AssignmentModule } from './assignment/assignment.module';
import { MarksModule } from './marks/marks.module';
import { NoticesModule } from './notices/notices.module';
import { StudentModule } from './modules/student/student.module';
import { FacultyModule } from './modules/faculty/faculty.module';
import { SubjectModule } from './subject/subject.module';
import { SemesterModule } from './semester/semester.module';
import { DivisionModule } from './division/division.module';
import { AdminModule } from './admin/admin.module';
import { AcademicModule } from './academic/academic.module';
import { DepartmentModule } from './department/department.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    ServicesModule,
    AuthModule,
    UsersModule,
    SemesterModule,
    DivisionModule,
    SubjectModule,
    StudentModule,
    FacultyModule,
    AdminModule,
    AcademicModule,
    AttendanceModule,
    AssignmentModule,
    DepartmentModule,
    MarksModule,
    NoticesModule,
  ],
})
export class AppModule {}
