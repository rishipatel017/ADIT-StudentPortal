import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicCoreService, AcademicContext } from '../academic/academic-core.service';
import { CreateAttendanceDto } from './dtos/create-attendance.dto';
import { UpdateAttendanceDto } from './dtos/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private academicContext: AcademicCoreService
  ) {}

  // Expose prisma for controller access
  get prismaClient() {
    return this.prisma;
  }

  async createAttendance(facultyId: number, createAttendanceDto: CreateAttendanceDto) {
    const { semester, subjectId, divisionId, lectureNo, topic, lectureDate, students } = createAttendanceDto;

    // Load unified academic context
    const context: AcademicContext = await this.academicContext.loadAcademicContext(
      semester,
      subjectId,
      divisionId,
      facultyId
    );

    // Validate faculty access
    const hasAccess = await this.academicContext.validateFacultyAccess(facultyId, subjectId, divisionId);
    if (!hasAccess) {
      throw new BadRequestException('Faculty not assigned to this subject-division combination');
    }

    // Check for duplicate attendance
    const existingSession = await this.prisma.attendanceSession.findFirst({
      where: {
        subjectId,
        divisionId,
        lectureDate: new Date(lectureDate),
        lectureNo,
      },
    });

    if (existingSession) {
      throw new BadRequestException('Attendance already taken for this lecture');
    }

    // Create attendance session
    const session = await this.prisma.attendanceSession.create({
      data: {
        semesterId: semester,
        subjectId,
        divisionId,
        facultyId,
        lectureNo,
        topic,
        lectureDate: new Date(lectureDate),
      },
    });

    // Create attendance records using context students
    const attendanceRecords = students.map(student => ({
      sessionId: session.id,
      studentId: student.studentId,
      status: student.status === 1, // Convert number to boolean
    }));

    await this.prisma.attendanceRecord.createMany({
      data: attendanceRecords,
    });

    return {
      session,
      context,
      records: attendanceRecords,
      totalStudents: context.students.length,
      presentCount: students.filter(s => s.status).length,
      absentCount: students.filter(s => !s.status).length,
    };
  }

  async getAttendanceHistory(facultyId: number, filters?: {
    semester?: number;
    subjectId?: number;
    divisionId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    const whereClause: any = { facultyId };
    
    if (filters?.semester) whereClause.semesterId = filters.semester;
    if (filters?.subjectId) whereClause.subjectId = filters.subjectId;
    if (filters?.divisionId) whereClause.divisionId = filters.divisionId;
    
    if (filters?.startDate || filters?.endDate) {
      whereClause.lectureDate = {};
      if (filters.startDate) whereClause.lectureDate.gte = new Date(filters.startDate);
      if (filters.endDate) whereClause.lectureDate.lte = new Date(filters.endDate);
    }

    const sessions = await this.prisma.attendanceSession.findMany({
      where: whereClause,
      include: {
        subject: true,
        division: true,
        records: {
          include: {
            student: true,
          },
        },
      },
      orderBy: {
        lectureDate: 'desc',
      },
    });

    return sessions.map(session => ({
      ...session,
      totalStudents: session.records.length,
      presentCount: session.records.filter(r => r.status).length,
      absentCount: session.records.filter(r => !r.status).length,
      attendancePercentage: Math.round((session.records.filter(r => r.status).length / session.records.length) * 100),
    }));
  }

  async getStudentsForAttendance(semester: number, subjectId: number, divisionId: number) {
    // Load unified academic context
    const context = await this.academicContext.loadAcademicContext(semester, subjectId, divisionId);

    return context.students.map(student => ({
      id: student.id,
      enrollmentNo: student.enrollmentNo,
      name: student.name,
      status: true, // Default to present
    }));
  }

  async updateAttendance(sessionId: number, facultyId: number, updateAttendanceDto: UpdateAttendanceDto) {
    // Verify faculty owns this session
    const session = await this.prisma.attendanceSession.findFirst({
      where: {
        id: sessionId,
        facultyId,
      },
    });

    if (!session) {
      throw new Error('Attendance session not found or access denied');
    }

    // Update attendance records
    const updatePromises = updateAttendanceDto.students.map(student =>
      this.prisma.attendanceRecord.updateMany({
        where: {
          sessionId,
          studentId: student.studentId,
        },
        data: {
          status: student.status === 1, // Convert number to boolean
        },
      }),
    );

    await Promise.all(updatePromises);

    // Return updated session
    return this.getAttendanceSession(sessionId);
  }

  async deleteAttendanceSession(sessionId: number, facultyId: number) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: {
        id: sessionId,
        facultyId,
      },
    });

    if (!session) {
      throw new Error('Attendance session not found or access denied');
    }

    // Delete records first (due to foreign key constraint)
    await this.prisma.attendanceRecord.deleteMany({
      where: {
        sessionId,
      },
    });

    // Delete session
    await this.prisma.attendanceSession.delete({
      where: {
        id: sessionId,
      },
    });

    return { message: 'Attendance session deleted successfully' };
  }

  async getAttendanceSession(sessionId: number) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        subject: true,
        division: true,
        faculty: true,
        records: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Attendance session not found');
    }

    return {
      ...session,
      totalStudents: session.records.length,
      presentCount: session.records.filter(r => r.status).length,
      absentCount: session.records.filter(r => !r.status).length,
      attendancePercentage: Math.round((session.records.filter(r => r.status).length / session.records.length) * 100),
    };
  }

  async exportAttendanceCSV(subjectId: number, divisionId: number, semester: number) {
    // Load unified academic context
    const context = await this.academicContext.loadAcademicContext(semester, subjectId, divisionId);

    // Get all sessions for this subject/division
    const sessions = await this.prisma.attendanceSession.findMany({
      where: {
        subjectId,
        divisionId,
        semesterId: semester,
      },
      include: {
        records: {
          include: {
            student: true,
          },
        },
      },
      orderBy: {
        lectureDate: 'asc',
      },
    });

    if (sessions.length === 0) {
      throw new NotFoundException('No attendance records found for the selected criteria');
    }

    // Build attendance matrix using context students
    const dates = sessions.map(s => s.lectureDate.toISOString().split('T')[0]);
    const csvRows = [];

    // Header row
    const header = ['Enrollment No', 'Name', ...dates, 'Total Present', 'Attendance %'];
    csvRows.push(header.join(','));

    // Student rows using context students
    for (const student of context.students) {
      const row = [student.enrollmentNo, student.name];
      let presentCount = 0;

      for (const session of sessions) {
        const record = session.records.find(r => r.studentId === student.id);
        const status = record ? (record.status ? 'P' : 'A') : 'A';
        row.push(status);
        
        if (record && record.status) presentCount++;
      }

      const attendancePercentage = Math.round((presentCount / sessions.length) * 100);
      row.push(presentCount.toString());
      row.push(`${attendancePercentage}%`);

      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  async getAttendanceStatistics(facultyId: number, subjectId?: number, divisionId?: number, semester?: number) {
    const whereClause: any = { facultyId };
    if (subjectId) whereClause.subjectId = subjectId;
    if (divisionId) whereClause.divisionId = divisionId;
    if (semester) whereClause.semesterId = semester;

    const sessions = await this.prisma.attendanceSession.findMany({
      where: whereClause,
      include: {
        records: {
          include: {
            student: true,
          },
        },
      },
    });

    if (sessions.length === 0) {
      return {
        totalLectures: 0,
        totalStudents: 0,
        averageAttendance: 0,
        defaulters: [],
      };
    }

    // Calculate student-wise attendance
    const studentAttendance = new Map();

    for (const session of sessions) {
      for (const record of session.records) {
        if (!studentAttendance.has(record.studentId)) {
          studentAttendance.set(record.studentId, {
            student: record.student,
            totalLectures: 0,
            presentCount: 0,
          });
        }

        const attendance = studentAttendance.get(record.studentId);
        attendance.totalLectures++;
        if (record.status) attendance.presentCount++;
      }
    }

    // Calculate statistics
    const totalLectures = sessions.length;
    const totalStudents = studentAttendance.size;
    let totalPresent = 0;

    const studentStats = Array.from(studentAttendance.values()).map(stat => {
      const percentage = Math.round((stat.presentCount / stat.totalLectures) * 100);
      totalPresent += stat.presentCount;
      
      return {
        ...stat,
        attendancePercentage: percentage,
      };
    });

    const averageAttendance = Math.round((totalPresent / (totalLectures * totalStudents)) * 100);
    
    // Find defaulters (attendance < 75%)
    const defaulters = studentStats.filter(stat => stat.attendancePercentage < 75);

    return {
      totalLectures,
      totalStudents,
      averageAttendance,
      defaulters: defaulters.map(d => ({
        enrollmentNo: d.student.enrollmentNo,
        name: d.student.name,
        attendancePercentage: d.attendancePercentage,
      })),
    };
  }

  async getStudentAttendance(studentId: number, semester?: number) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        division: true,
        semester: true,
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const whereClause: any = {
      records: {
        some: {
          studentId,
        },
      },
    };

    if (semester) whereClause.semesterId = semester;

    const sessions = await this.prisma.attendanceSession.findMany({
      where: whereClause,
      include: {
        subject: true,
        records: {
          where: {
            studentId,
          },
        },
      },
      orderBy: {
        lectureDate: 'desc',
      },
    });

    return sessions.map(session => ({
      date: session.lectureDate,
      subject: session.subject.name,
      topic: session.topic,
      lectureNo: session.lectureNo,
      status: session.records[0]?.status || false,
    }));
  }
}
