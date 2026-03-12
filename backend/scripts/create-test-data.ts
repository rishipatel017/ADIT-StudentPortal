import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createComprehensiveTestData() {
  try {
    console.log('Creating comprehensive test data...');

    // Create departments (or get existing ones)
    let itDepartment = await prisma.department.findUnique({
      where: { code: 'IT' }
    });

    if (!itDepartment) {
      itDepartment = await prisma.department.create({
        data: {
          name: 'Information Technology',
          code: 'IT',
        },
      });
    }

    let csDepartment = await prisma.department.findUnique({
      where: { code: 'CS' }
    });

    if (!csDepartment) {
      csDepartment = await prisma.department.create({
        data: {
          name: 'Computer Science',
          code: 'CS',
        },
      });
    }

    console.log('Created departments:', { itDepartment, csDepartment });

    // Create semesters (or get existing ones)
    const semesters = [];
    for (let i = 1; i <= 8; i++) {
      let semester = await prisma.semester.findFirst({
        where: { 
          number: i,
          departmentId: itDepartment.id 
        }
      });

      if (!semester) {
        semester = await prisma.semester.create({
          data: {
            number: i,
            departmentId: itDepartment.id,
          },
        });
      }
      semesters.push(semester);
    }

    console.log('Created semesters:', semesters.length);

    // Create divisions (or get existing ones)
    const divisions = [];
    for (const semester of semesters) {
      for (let div = 1; div <= 3; div++) {
        let division = await prisma.division.findFirst({
          where: {
            name: `Division ${div}`,
            semesterId: semester.id,
          }
        });

        if (!division) {
          division = await prisma.division.create({
            data: {
              name: `Division ${div}`,
              semesterId: semester.id,
            },
          });
        }
        divisions.push(division);
      }
    }

    console.log('Created divisions:', divisions.length);

    // Create subjects
    const subjects = [];
    const subjectData = [
      { name: 'Data Structures', code: 'DS', type: 'THEORY', credits: 4 },
      { name: 'Algorithms', code: 'ALGO', type: 'THEORY', credits: 4 },
      { name: 'Database Systems', code: 'DB', type: 'THEORY', credits: 3 },
      { name: 'Web Development', code: 'WEB', type: 'PRACTICAL', credits: 3 },
      { name: 'Software Engineering', code: 'SE', type: 'THEORY', credits: 3 },
      { name: 'Machine Learning', code: 'ML', type: 'ELECTIVE', credits: 3 },
    ];

    for (let i = 0; i < subjectData.length; i++) {
      const subject = await prisma.subject.create({
        data: {
          ...subjectData[i],
          semesterId: semesters[i % semesters.length].id,
        },
      });
      subjects.push(subject);
    }

    console.log('Created subjects:', subjects.length);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@university.edu',
        password: adminPassword,
        role: 'ADMIN',
      },
    });

    await prisma.admin.create({
      data: {
        userId: adminUser.id,
        name: 'System Administrator',
      },
    });

    // Create faculty users
    const facultyUsers = [];
    const facultyData = [
      { name: 'Dr. John Smith', email: 'john.smith@university.edu', designation: 'Professor', qualification: 'PhD Computer Science' },
      { name: 'Dr. Jane Doe', email: 'jane.doe@university.edu', designation: 'Associate Professor', qualification: 'PhD Information Technology' },
      { name: 'Dr. Robert Johnson', email: 'robert.johnson@university.edu', designation: 'Assistant Professor', qualification: 'M.Tech Computer Science' },
    ];

    for (const faculty of facultyData) {
      const facultyPassword = await bcrypt.hash('faculty123', 12);
      const user = await prisma.user.create({
        data: {
          email: faculty.email,
          password: facultyPassword,
          role: 'FACULTY',
        },
      });

      const facultyRecord = await prisma.faculty.create({
        data: {
          userId: user.id,
          name: faculty.name,
          email: faculty.email,
          designation: faculty.designation,
          qualification: faculty.qualification,
          phone: '9876543210',
          joiningDate: new Date(),
          pastExperienceYears: Math.floor(Math.random() * 10) + 1,
          departmentId: itDepartment.id,
        },
      });

      facultyUsers.push({ user, faculty: facultyRecord });
    }

    console.log('Created faculty users:', facultyUsers.length);

    // Create student users
    const studentUsers = [];
    const studentNames = [
      'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Edward Norton',
      'Fiona Green', 'George Wilson', 'Helen Troy', 'Ian Malcolm', 'Julia Roberts',
    ];

    for (let i = 0; i < studentNames.length; i++) {
      const studentPassword = await bcrypt.hash('student123', 12);
      const user = await prisma.user.create({
        data: {
          email: `student${i + 1}@university.edu`,
          password: studentPassword,
          role: 'STUDENT',
        },
      });

      const studentRecord = await prisma.student.create({
        data: {
          userId: user.id,
          name: studentNames[i],
          enrollmentNo: `IT2025${String(i + 1).padStart(3, '0')}`,
          email: `student${i + 1}@university.edu`,
          divisionId: divisions[i % divisions.length].id,
          semesterId: semesters[i % semesters.length].id,
          departmentId: itDepartment.id,
        },
      });

      studentUsers.push({ user, student: studentRecord });
    }

    console.log('Created student users:', studentUsers.length);

    // Create faculty-subject assignments
    for (const facultyUser of facultyUsers) {
      for (let i = 0; i < 2; i++) {
        await prisma.facultySubject.create({
          data: {
            facultyId: facultyUser.faculty.id,
            subjectId: subjects[Math.floor(Math.random() * subjects.length)].id,
            divisionId: divisions[Math.floor(Math.random() * divisions.length)].id,
          },
        });
      }
    }

    console.log('Created faculty-subject assignments');

    // Create some sample assignments
    for (const subject of subjects.slice(0, 3)) {
      const faculty = facultyUsers[Math.floor(Math.random() * facultyUsers.length)];
      await prisma.assignment.create({
        data: {
          title: `${subject.name} Assignment`,
          description: `Complete the assignment for ${subject.name}`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          semesterId: subject.semesterId,
          subjectId: subject.id,
          facultyId: faculty.faculty.id,
        },
      });
    }

    console.log('Created sample assignments');

    // Create some sample notices
    await prisma.notice.create({
      data: {
        title: 'Welcome to IT Department',
        content: 'Welcome all students to the Information Technology department for the academic year 2025-2026.',
        attachment: null,
        createdById: adminUser.id,
        createdByRole: 'ADMIN',
        departmentId: itDepartment.id,
        isForFaculty: false,
        isForStudents: true,
      },
    });

    console.log('Created sample notices');

    console.log('✅ Test data creation completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@university.edu / admin123');
    console.log('Faculty: john.smith@university.edu / faculty123');
    console.log('Student: student1@university.edu / student123');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  createComprehensiveTestData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { createComprehensiveTestData };
