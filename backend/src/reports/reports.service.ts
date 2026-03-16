import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminReportSummary() {
    const [deptDist, studentGrowth, totalsResult, subjectPerformance, attendanceSessions] = await Promise.all([
      this.prisma.department.findMany({
        select: { name: true, _count: { select: { students: true } } }
      }),
      this.prisma.student.findMany({
        where: { deletedAt: null },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' }
      }),
      Promise.all([
        this.prisma.student.count({ where: { deletedAt: null } }),
        this.prisma.faculty.count({ where: { deletedAt: null } }),
        this.prisma.subject.count(),
        this.prisma.division.count(),
      ]),
      this.prisma.subject.findMany({
        select: {
          name: true,
          code: true,
          marksUploads: {
            select: {
              marks: { select: { marksObtained: true } }
            }
          }
        }
      }),
      this.prisma.attendanceSession.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // Last 30 days
        include: { records: { select: { status: true } } }
      })
    ]);

    const academicPerformance = subjectPerformance
      .map(s => {
        const allMarks = s.marksUploads.flatMap(u => u.marks.map(m => m.marksObtained));
        const avg = allMarks.length > 0 ? allMarks.reduce((a, b) => a + b, 0) / allMarks.length : 0;
        return { name: s.code, count: Math.round(avg * 10) / 10 };
      })
      .filter(s => s.count > 0)
      .slice(0, 10);

    const allAttendanceRecords = (attendanceSessions || []).flatMap(s => s.records || []);
    const presentCount = allAttendanceRecords.filter(r => r.status).length;
    const globalAttendance = allAttendanceRecords.length > 0 ? Math.round((presentCount / allAttendanceRecords.length) * 100) : 0;

    return {
      totalStudents: totalsResult[0],
      totalFaculty: totalsResult[1],
      totalSubjects: totalsResult[2],
      totalDivisions: totalsResult[3],
      globalAttendance,
      departmentDistribution: deptDist.map(d => ({ name: d.name, count: d._count.students })),
      studentGrowth: studentGrowth.map(s => s.createdAt),
      academicPerformance
    };
  }

  async getFacultyReportSummary(userId: number) {
    const faculty = await this.prisma.faculty.findUnique({ where: { userId } });
    if (!faculty) throw new NotFoundException('Faculty profile not found');

    const [marks, attendance] = await Promise.all([
      this.prisma.studentMarks.findMany({
        where: { upload: { facultyId: faculty.id } },
        include: { upload: { include: { subject: true } } }
      }),
      this.prisma.attendanceSession.findMany({
        where: { facultyId: faculty.id },
        include: { records: true, subject: true },
        orderBy: { lectureDate: 'desc' },
        take: 20
      })
    ]);

    return {
      marksDistribution: this.calculateMarksDistribution(marks),
      attendanceTrend: this.calculateAttendanceTrend(attendance)
    };
  }

  private groupDataByMonth(data: any[]) {
    // Current year months template
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const groups: { [key: string]: number } = {};
    
    // Initialize groups with 0 for all months to show complete trend
    months.forEach(m => groups[m] = 0);

    data.forEach(item => {
      try {
        const date = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
        if (isNaN(date.getTime())) return;
        
        const month = date.toLocaleString('default', { month: 'short' });
        groups[month] = (groups[month] || 0) + 1;
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    });

    return months.map(name => ({ name, count: groups[name] }));
  }

  private calculateMarksDistribution(marks: any[]) {
    const ranges = [
      { name: '0-5', count: 0 },
      { name: '6-10', count: 0 },
      { name: '11-15', count: 0 },
      { name: '16-20', count: 0 }
    ];

    marks.forEach(m => {
      if (m.marksObtained <= 5) ranges[0].count++;
      else if (m.marksObtained <= 10) ranges[1].count++;
      else if (m.marksObtained <= 15) ranges[2].count++;
      else ranges[3].count++;
    });

    return ranges;
  }

  private calculateAttendanceTrend(sessions: any[]) {
    return sessions.reverse().map(s => {
      const total = s.records.length;
      const present = s.records.filter((r: any) => r.status === true).length;
      return {
        name: s.subject.code + ' ' + new Date(s.lectureDate).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        percentage: total > 0 ? Math.round((present / total) * 100) : 0
      };
    });
  }
}
