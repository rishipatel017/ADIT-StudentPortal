import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Create IT Department first
  const itDepartment = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      name: 'Information Technology',
      code: 'IT',
    },
  });

  console.log('Created IT Department');

  // Create semesters (now with department relation)
  const semesters = await Promise.all([
    prisma.semester.upsert({
      where: { number_departmentId: { number: 1, departmentId: itDepartment.id } },
      update: {},
      create: { number: 1, departmentId: itDepartment.id },
    }),
    prisma.semester.upsert({
      where: { number_departmentId: { number: 2, departmentId: itDepartment.id } },
      update: {},
      create: { number: 2, departmentId: itDepartment.id },
    }),
    prisma.semester.upsert({
      where: { number_departmentId: { number: 3, departmentId: itDepartment.id } },
      update: {},
      create: { number: 3, departmentId: itDepartment.id },
    }),
    prisma.semester.upsert({
      where: { number_departmentId: { number: 4, departmentId: itDepartment.id } },
      update: {},
      create: { number: 4, departmentId: itDepartment.id },
    }),
  ]);

  console.log('Created semesters');

  // Create divisions
  const divisions = await Promise.all([
    prisma.division.upsert({
      where: { id: 1 },
      update: {},
      create: { name: 'IT-A', semesterId: 3 },
    }),
    prisma.division.upsert({
      where: { id: 2 },
      update: {},
      create: { name: 'IT-B', semesterId: 3 },
    }),
    prisma.division.upsert({
      where: { id: 3 },
      update: {},
      create: { name: 'IT-A', semesterId: 4 },
    }),
    prisma.division.upsert({
      where: { id: 4 },
      update: {},
      create: { name: 'IT-B', semesterId: 4 },
    }),
  ]);

  console.log('Created divisions');

  // Create subjects
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Data Structures & Algorithms',
        code: 'DSA301',
        type: 'CORE',
        credits: 4,
        semesterId: 3,
      },
    }),
    prisma.subject.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Database Management Systems',
        code: 'DBMS302',
        type: 'CORE',
        credits: 4,
        semesterId: 3,
      },
    }),
    prisma.subject.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Web Development',
        code: 'WD303',
        type: 'ELECTIVE',
        credits: 3,
        semesterId: 3,
      },
    }),
    prisma.subject.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: 'Machine Learning',
        code: 'ML401',
        type: 'ELECTIVE',
        credits: 3,
        semesterId: 4,
      },
    }),
  ]);

  console.log('Created subjects');

  // Create admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@itcollege.edu' },
    update: {},
    create: {
      email: 'admin@itcollege.edu',
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  });

  await prisma.admin.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      name: 'Administrator',
    },
  });

  console.log('Created admin user');

  // Create faculty users
  const facultyUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'hod@itcollege.edu' },
      update: {},
      create: {
        email: 'hod@itcollege.edu',
        password: await bcrypt.hash('faculty123', 10),
        role: 'FACULTY',
      },
    }),
    prisma.user.upsert({
      where: { email: 'ashwin@itcollege.edu' },
      update: {},
      create: {
        email: 'ashwin@itcollege.edu',
        password: await bcrypt.hash('faculty123', 10),
        role: 'FACULTY',
      },
    }),
  ]);

  await Promise.all([
    prisma.faculty.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Dr. Ashwin Mehta',
        email: 'ashwin@itcollege.edu',
        designation: 'Professor & HOD',
        qualification: 'Ph.D. Computer Science',
        joiningDate: new Date('2015-01-15'),
        departmentId: itDepartment.id,
        userId: facultyUsers[0].id,
      },
    }),
    prisma.faculty.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Prof. Neha Patel',
        email: 'neha@itcollege.edu',
        designation: 'Associate Professor',
        qualification: 'M.Tech Computer Science',
        joiningDate: new Date('2018-06-20'),
        departmentId: itDepartment.id,
        userId: facultyUsers[1].id,
      },
    }),
  ]);

  console.log('Created faculty users');

  // Create student users
  const studentUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'rahul@itcollege.edu' },
      update: {},
      create: {
        email: 'rahul@itcollege.edu',
        password: await bcrypt.hash('student123', 10),
        role: 'STUDENT',
      },
    }),
    prisma.user.upsert({
      where: { email: 'priya@itcollege.edu' },
      update: {},
      create: {
        email: 'priya@itcollege.edu',
        password: await bcrypt.hash('student123', 10),
        role: 'STUDENT',
      },
    }),
    prisma.user.upsert({
      where: { email: 'kunal@itcollege.edu' },
      update: {},
      create: {
        email: 'kunal@itcollege.edu',
        password: await bcrypt.hash('student123', 10),
        role: 'STUDENT',
      },
    }),
  ]);

  await Promise.all([
    prisma.student.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Rahul Patel',
        enrollmentNo: 'IT2023001',
        email: 'rahul@itcollege.edu',
        departmentId: itDepartment.id,
        divisionId: 1, // IT-A, Semester 3
        semesterId: 3,
        userId: studentUsers[0].id,
      },
    }),
    prisma.student.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Priya Shah',
        enrollmentNo: 'IT2023002',
        email: 'priya@itcollege.edu',
        departmentId: itDepartment.id,
        divisionId: 2, // IT-B, Semester 3
        semesterId: 3,
        userId: studentUsers[1].id,
      },
    }),
    prisma.student.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Kunal Desai',
        enrollmentNo: 'IT2023003',
        email: 'kunal@itcollege.edu',
        departmentId: itDepartment.id,
        divisionId: 1, // IT-A, Semester 3
        semesterId: 3,
        userId: studentUsers[2].id,
      },
    }),
  ]);

  console.log('Created student users');

  // Create faculty-subject assignments
  await Promise.all([
    prisma.facultySubject.upsert({
      where: {
        facultyId_subjectId_divisionId: {
          facultyId: 1,
          subjectId: 1,
          divisionId: 1,
        },
      },
      update: {},
      create: {
        facultyId: 1,
        subjectId: 1,
        divisionId: 1,
      },
    }),
    prisma.facultySubject.upsert({
      where: {
        facultyId_subjectId_divisionId: {
          facultyId: 1,
          subjectId: 2,
          divisionId: 1,
        },
      },
      update: {},
      create: {
        facultyId: 1,
        subjectId: 2,
        divisionId: 1,
      },
    }),
    prisma.facultySubject.upsert({
      where: {
        facultyId_subjectId_divisionId: {
          facultyId: 2,
          subjectId: 3,
          divisionId: 2,
        },
      },
      update: {},
      create: {
        facultyId: 2,
        subjectId: 3,
        divisionId: 2,
      },
    }),
  ]);

  console.log('Created faculty-subject assignments');

  console.log('Database seeding completed successfully!');
  console.log('\\nLogin credentials:');
  console.log('Admin: admin@itcollege.edu / admin123');
  console.log('Faculty: hod@itcollege.edu / faculty123');
  console.log('Student: rahul@itcollege.edu / student123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
