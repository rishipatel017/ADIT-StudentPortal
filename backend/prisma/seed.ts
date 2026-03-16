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
    prisma.semester.upsert({
      where: { number_departmentId: { number: 5, departmentId: itDepartment.id } },
      update: {},
      create: { number: 5, departmentId: itDepartment.id },
    }),
    prisma.semester.upsert({
      where: { number_departmentId: { number: 6, departmentId: itDepartment.id } },
      update: {},
      create: { number: 6, departmentId: itDepartment.id },
    }),
    prisma.semester.upsert({
      where: { number_departmentId: { number: 7, departmentId: itDepartment.id } },
      update: {},
      create: { number: 7, departmentId: itDepartment.id },
    }),
    prisma.semester.upsert({
      where: { number_departmentId: { number: 8, departmentId: itDepartment.id } },
      update: {},
      create: { number: 8, departmentId: itDepartment.id },
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
  const subjectsData = [
    { name: 'Calculus', code: '202000104', type: 'Basic Science Course', credits: 4, semesterId: 1 },
    { name: 'Computer Programming with C', code: '202000110', type: 'Engineering Science Course', credits: 4, semesterId: 1 },
    { name: 'Basics of Electrical and Electronics Engineering', code: '202001203', type: 'Engineering Science Course', credits: 4, semesterId: 1 },
    { name: 'Constitution of India', code: '202001206', type: 'Mandatory Course', credits: 0, semesterId: 1 },
    { name: 'Engineering Workshop', code: '202001209', type: 'Engineering Science Course', credits: 2, semesterId: 1 },
    { name: 'Professional Communication', code: '202001215', type: 'Humany And Social Science Course', credits: 3, semesterId: 1 },
    { name: 'Linear Algebra Vector Calculus and ODE', code: '202000211', type: 'Basic Science Course', credits: 4, semesterId: 2 },
    { name: 'Object Oriented Programming', code: '202000212', type: 'Engineering Science Course', credits: 4, semesterId: 2 },
    { name: 'Basic Mechanical Engineering', code: '202001202', type: 'Engineering Science Course', credits: 4, semesterId: 2 },
    { name: 'Energy and Environment Science', code: '202001207', type: 'Basic Science Course', credits: 3, semesterId: 2 },
    { name: 'Engineering Graphics', code: '202001208', type: 'Engineering Science Course', credits: 4, semesterId: 2 },
    { name: 'Physics', code: '202001213', type: 'Basic Science Course', credits: 4, semesterId: 2 },
    { name: 'Liberal Arts Painting', code: '900009902', type: 'Liberal Arts', credits: 2, semesterId: 2 },
    { name: 'Liberal Arts Photography', code: '900009903', type: 'Liberal Arts', credits: 2, semesterId: 2 },
    { name: 'Liberal Arts Media and Graphics', code: '900009904', type: 'Liberal Arts', credits: 2, semesterId: 2 },
    { name: 'Liberal Arts Music', code: '900009905', type: 'Liberal Arts', credits: 2, semesterId: 2 },
    { name: 'Liberal Arts Dramatics', code: '900009906', type: 'Liberal Arts', credits: 2, semesterId: 2 },
    { name: 'Liberal Arts Contemporary Dance', code: '900009907', type: 'Liberal Arts', credits: 2, semesterId: 2 },
    { name: 'Probability Statistics and Numerical Methods', code: '202000303', type: 'Basic Science Courses', credits: 4, semesterId: 3 },
    { name: 'Fundamentals of Economics and Business Management', code: '202003402', type: 'Humanities and Social Science', credits: 3, semesterId: 3 },
    { name: 'Indian Ethos and Value Education', code: '202003403', type: 'Mandatory Course', credits: 0, semesterId: 3 },
    { name: 'Data Structures', code: '202040301', type: 'Professional Core Course', credits: 5, semesterId: 3 },
    { name: 'Database Management Systems', code: '202040302', type: 'Professional Core Course', credits: 5, semesterId: 3 },
    { name: 'Digital Fundamentals', code: '202040303', type: 'Engineering Science', credits: 4, semesterId: 3 },
    { name: 'Creativity Problem Solving and Innovation', code: '900009901', type: 'Skill Development', credits: 2, semesterId: 3 },
    { name: 'Technical Writing and Soft Skills', code: '202003404', type: 'Humanities and Social Science', credits: 3, semesterId: 4 },
    { name: 'Entrepreneur Skills', code: '202003405', type: 'Mandatory Course', credits: 0, semesterId: 4 },
    { name: 'Computer Organization and Architecture', code: '202040401', type: 'Professional Core Course', credits: 4, semesterId: 4 },
    { name: 'Operating Systems', code: '202040402', type: 'Professional Core Course', credits: 4, semesterId: 4 },
    { name: 'Seminar', code: '202040404', type: 'Mandatory Course', credits: 1, semesterId: 4 },
    { name: 'Computer Networks', code: '202044501', type: 'Professional Core Course', credits: 4, semesterId: 4 },
    { name: 'Programming with Java', code: '202044502', type: 'Professional Core Course', credits: 4, semesterId: 4 },
    { name: 'Artificial Intelligence', code: '202044503', type: 'Professional Elective', credits: 4, semesterId: 5 },
    { name: 'Programming with Python', code: '202044504', type: 'Professional Core Course', credits: 4, semesterId: 5 },
    { name: 'Web Development', code: '202044505', type: 'Professional Core Course', credits: 4, semesterId: 5 },
    { name: 'Design and Analysis of Algorithm', code: '202045601', type: 'Professional Core Course', credits: 5, semesterId: 5 },
    { name: 'Software Engineering', code: '202045602', type: 'Professional Core Course', credits: 4, semesterId: 5 },
    { name: '.NET Technology', code: '202045604', type: 'Professional Elective', credits: 4, semesterId: 5 },
    { name: 'Advance Java Programming', code: '202045605', type: 'Professional Elective', credits: 4, semesterId: 5 },
    { name: 'Cyber Security', code: '202045607', type: 'Professional Elective', credits: 4, semesterId: 5 },
    { name: 'Mini Project', code: '202040601', type: 'Mandatory Course', credits: 2, semesterId: 6 },
    { name: 'Machine Learning', code: '202045609', type: 'Professional Core Course', credits: 4, semesterId: 6 },
    { name: 'Advanced Web Development', code: '202046701', type: 'Professional Elective', credits: 4, semesterId: 6 },
    { name: 'Computer Vision and Image Processing', code: '202046705', type: 'Professional Elective', credits: 4, semesterId: 6 },
    { name: 'Data Mining and Business Intelligence', code: '202046706', type: 'Professional Elective', credits: 4, semesterId: 6 },
    { name: 'Information and Network Security', code: '202046708', type: 'Professional Core Course', credits: 4, semesterId: 6 },
    { name: 'Internet of Things', code: '202046709', type: 'Professional Core Course', credits: 4, semesterId: 6 },
    { name: 'Software Project Management', code: '202046713', type: 'Professional Elective', credits: 4, semesterId: 6 },
    { name: 'Summer Training', code: '202000701', type: 'Mandatory Course', credits: 2, semesterId: 7 },
    { name: 'Blockchain', code: '202046703', type: 'Professional Elective', credits: 4, semesterId: 7 },
    { name: 'Data Science and Visualization', code: '202046707', type: 'Professional Core Course', credits: 4, semesterId: 7 },
    { name: 'Introduction to Cloud Computing', code: '202046710', type: 'Professional Core Course', credits: 4, semesterId: 7 },
    { name: 'Language Processors', code: '202046711', type: 'Professional Elective', credits: 4, semesterId: 7 },
    { name: 'Mobile Application Development', code: '202046712', type: 'Professional Core Course', credits: 4, semesterId: 7 },
    { name: 'UI UX Design', code: '202046715', type: 'Professional Elective', credits: 4, semesterId: 7 },
    { name: 'Advanced Software Engineering', code: '202047801', type: 'Professional Elective', credits: 4, semesterId: 7 },
    { name: 'Big Data Analytics', code: '202047803', type: 'Professional Elective', credits: 4, semesterId: 7 },
    { name: 'Deep Learning and Applications', code: '202047804', type: 'Professional Elective', credits: 4, semesterId: 7 },
    { name: 'Management of IT Infrastructure', code: '202047808', type: 'Professional Elective', credits: 4, semesterId: 7 },
    { name: 'Industrial Internship', code: '202000801', type: 'Internship', credits: 16, semesterId: 8 },
    { name: 'Augmented Reality and Virtual Reality', code: '202047802', type: 'Professional Elective', credits: 4, semesterId: 8 },
    { name: 'Geographical Information Systems', code: '202047805', type: 'Professional Elective', credits: 4, semesterId: 8 },
    { name: 'High Performance Computing', code: '202047806', type: 'Professional Elective', credits: 4, semesterId: 8 },
    { name: 'Introduction to Software Defined Networking', code: '202047807', type: 'Professional Elective', credits: 4, semesterId: 8 },
    { name: 'Natural Language Processing', code: '202047809', type: 'Professional Elective', credits: 4, semesterId: 8 },
    { name: 'Service Oriented Computing', code: '202047810', type: 'Professional Elective', credits: 4, semesterId: 8 },
    { name: 'Industry User Defined Project', code: '202080801', type: 'Project', credits: 8, semesterId: 8 },
  ];

  for (const s of subjectsData) {
    const sem = semesters.find(sm => sm.number === s.semesterId);
    if (sem) {
      await prisma.subject.upsert({
        where: { 
          code_semesterId: { 
            code: s.code, 
            semesterId: sem.id 
          } 
        },
        update: {
          name: s.name,
          type: s.type,
          credits: s.credits,
        },
        create: {
          name: s.name,
          code: s.code,
          type: s.type,
          credits: s.credits,
          semesterId: sem.id,
        },
      });
    }
  }

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

  // Create faculty users and profiles
  const facultyData = [
    { name: 'Dr. Narendrasinh Chauhan', email: 'head.it@adit.ac.in', designation: 'Professor and Head of Department', qualification: 'PhD IIT Roorkee ME CE BE CE', phone: '9377559385', joiningDate: '2020-01-01', pastExperienceYears: 23 },
    { name: 'Dr. Dinesh Prajapati', email: 'it.djprajapati@adit.ac.in', designation: 'Associate Professor', qualification: 'PhD CSE Nirma University', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 20 },
    { name: 'Dr. Krunal Patel', email: 'it.krunalpatel@adit.ac.in', designation: 'Associate Professor', qualification: 'PhD Computer Engineering', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 17 },
    { name: 'Dr. Shital Gondaliya', email: 'cp.shitalgondaliya@adit.ac.in', designation: 'Associate Professor', qualification: 'BE CE ME CE PhD', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 20 },
    { name: 'Dr. Anand Pandya', email: 'it.anandpandya@adit.ac.in', designation: 'Assistant Professor', qualification: 'PhD MTech CE BE IT', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 13 },
    { name: 'Jitiksha Patel', email: 'it.jitikshapatel@adit.ac.in', designation: 'Assistant Professor', qualification: 'PhD Pursuing MTech ICT BE IT', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 12 },
    { name: 'Hemanshu Patel', email: 'it.hemanshu@adit.ac.in', designation: 'Assistant Professor', qualification: 'ME IT BE IT', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 11 },
    { name: 'Nayan Mali', email: 'nayankumar.mali@cvmu.edu.in', designation: 'Assistant Professor', qualification: 'PhD Pursuing ME IT BE IT', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 13 },
    { name: 'Keyur Patel', email: 'it.keyurpatel@adit.ac.in', designation: 'Assistant Professor', qualification: 'PhD Pursuing MTech IT BE IT', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 11 },
    { name: 'Mayur Ajmeri', email: 'it.mayurajmeri@adit.ac.in', designation: 'Assistant Professor', qualification: 'ME Computer Engineering PhD Pursuing', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 11 },
    { name: 'Himani Joshi', email: 'it.himanijoshi@adit.ac.in', designation: 'Assistant Professor', qualification: 'ME Computer Engineering', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 8 },
    { name: 'Anjali Rajput', email: 'it.anjalirajput@adit.ac.in', designation: 'Assistant Professor', qualification: 'ME CE BE CSE', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 4 },
    { name: 'Khushali Patel', email: 'it.khushalipatel@adit.ac.in', designation: 'Assistant Professor', qualification: 'ME CE BE CE', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 16 },
    { name: 'Riddhi Shukla', email: 'it.riddhishukla@adit.ac.in', designation: 'Assistant Professor', qualification: 'PhD Pursuing ME CE BE IT', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 11 },
    { name: 'Ranna Makwana', email: 'it.rannamakwana@adit.ac.in', designation: 'Assistant Professor', qualification: 'PhD Pursuing ME CE BE CE', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 4 },
    { name: 'Vimal Bhatt', email: 'it.vimalbhatt@adit.ac.in', designation: 'Assistant Professor', qualification: 'PhD Pursuing MTech CSE BE Computer', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 17 },
    { name: 'Dr. Trilok Suthar', email: 'it.triloksuthar@adit.ac.in', designation: 'Assistant Professor', qualification: 'PhD MTech', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 11 },
    { name: 'Anu Chauhan', email: 'it.anuchauhan@adit.ac.in', designation: 'Assistant Professor', qualification: 'MTech CE BE CE Diploma CE', phone: '9510625670', joiningDate: '2020-01-01', pastExperienceYears: 1 },
    { name: 'Riya Joshi', email: 'none@gmail.com', designation: 'Assistant Professor', qualification: 'MTech CE BE Computer Engineering', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 6 },
    { name: 'Khushi Bharadva', email: 'it.khushibharadva@adit.ac.in', designation: 'Assistant Professor', qualification: 'MTech IT', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 8 },
    { name: 'Sonam Singh', email: 'it.sonamsingh@adit.ac.in', designation: 'Assistant Professor', qualification: 'MTech BTech', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 2 },
    { name: 'Kavya Prajapati', email: 'it.kavyaprajapati@adit.ac.in', designation: 'Assistant Professor', qualification: 'BE CE MTech CSE', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 5 },
    { name: 'Priyanka Gondaliya', email: 'it.priyankagondaliya@adit.ac.in', designation: 'Assistant Professor', qualification: 'Diploma IT BE IT MTech ICT', phone: '', joiningDate: '2020-01-01', pastExperienceYears: 16 },
  ];

  for (const f of facultyData) {
    const user = await prisma.user.upsert({
      where: { email: f.email },
      update: {},
      create: {
        email: f.email,
        password: await bcrypt.hash('faculty123', 10),
        role: 'FACULTY',
      },
    });

    await prisma.faculty.upsert({
      where: { userId: user.id },
      update: {
        name: f.name,
        email: f.email,
        designation: f.designation,
        qualification: f.qualification,
        phone: f.phone || null,
        joiningDate: new Date(f.joiningDate),
        pastExperienceYears: f.pastExperienceYears,
        departmentId: itDepartment.id,
      },
      create: {
        name: f.name,
        email: f.email,
        designation: f.designation,
        qualification: f.qualification,
        phone: f.phone || null,
        joiningDate: new Date(f.joiningDate),
        pastExperienceYears: f.pastExperienceYears,
        departmentId: itDepartment.id,
        userId: user.id,
      },
    });
  }

  console.log('Created faculty users');

  // Create student users
  const studentData = [
    { name: 'Rahul Patel', enrollmentNo: 'IT2023001', email: 'rahul@itcollege.edu', divisionId: 1, semesterId: 3 },
    { name: 'Priya Shah', enrollmentNo: 'IT2023002', email: 'priya@itcollege.edu', divisionId: 2, semesterId: 3 },
    { name: 'Kunal Desai', enrollmentNo: 'IT2023003', email: 'kunal@itcollege.edu', divisionId: 1, semesterId: 3 },
    { name: 'Sagar Mehta', enrollmentNo: 'IT2023004', email: 'sagar@itcollege.edu', divisionId: 2, semesterId: 3 },
    { name: 'Anjali Gupta', enrollmentNo: 'IT2023005', email: 'anjali@itcollege.edu', divisionId: 1, semesterId: 3 },
  ];

  const studentUsers = [];
  for (const s of studentData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        password: await bcrypt.hash('student123', 10),
        role: 'STUDENT',
      },
    });
    studentUsers.push(user);

    await prisma.student.upsert({
      where: { enrollmentNo: s.enrollmentNo },
      update: {
        name: s.name,
        email: s.email,
        departmentId: itDepartment.id,
        divisionId: s.divisionId,
        semesterId: s.semesterId,
      },
      create: {
        name: s.name,
        enrollmentNo: s.enrollmentNo,
        email: s.email,
        departmentId: itDepartment.id,
        divisionId: s.divisionId,
        semesterId: s.semesterId,
        userId: user.id,
      },
    });
  }

  console.log('Created student users');

  // Create Marks Uploads and Student Marks
  const dsaSubject = await prisma.subject.findUnique({ where: { code_semesterId: { code: '202040301', semesterId: 3 } } }); // Data Structures (Sem 3)
  const dbmsSubject = await prisma.subject.findUnique({ where: { code_semesterId: { code: '202040302', semesterId: 3 } } }); // DBMS (Sem 3)
  const cpSubject = await prisma.subject.findUnique({ where: { code_semesterId: { code: '202000110', semesterId: 1 } } }); // Computer Programming (Sem 1)
  const dsa401Subject = await prisma.subject.findUnique({ where: { code_semesterId: { code: '202040401', semesterId: 4 } } }); // COA (Sem 4)

  const headFaculty = await prisma.faculty.findFirst({ where: { email: 'head.it@adit.ac.in' } });
  const dineshFaculty = await prisma.faculty.findFirst({ where: { email: 'it.djprajapati@adit.ac.in' } });

  const marksUploadsData = [
    { id: 1, subjectId: dsaSubject?.id || 1, divisionId: 1, facultyId: headFaculty?.id || 1, semesterId: 3 },
    { id: 2, subjectId: dbmsSubject?.id || 2, divisionId: 1, facultyId: headFaculty?.id || 1, semesterId: 3 },
    { id: 3, subjectId: cpSubject?.id || 3, divisionId: 2, facultyId: dineshFaculty?.id || 2, semesterId: 1 },
    { id: 4, subjectId: dsaSubject?.id || 1, divisionId: 2, facultyId: dineshFaculty?.id || 2, semesterId: 3 },
    { id: 5, subjectId: dbmsSubject?.id || 2, divisionId: 2, facultyId: headFaculty?.id || 1, semesterId: 3 },
    { id: 6, subjectId: dsa401Subject?.id || 4, divisionId: 3, facultyId: dineshFaculty?.id || 2, semesterId: 4 },
  ];

  for (const mu of marksUploadsData) {
    if (mu.subjectId) {
      await prisma.marksUpload.upsert({
        where: { id: mu.id },
        update: {
          subjectId: mu.subjectId,
          divisionId: mu.divisionId,
          facultyId: mu.facultyId,
          semesterId: mu.semesterId,
        },
        create: {
          id: mu.id,
          subjectId: mu.subjectId,
          divisionId: mu.divisionId,
          facultyId: mu.facultyId,
          semesterId: mu.semesterId,
        },
      });
    }
  }

  // Map students by enrollment to their database IDs for marks received
  const studentMap: Record<string, number> = {};
  const allStudents = await prisma.student.findMany();
  allStudents.forEach(s => {
    studentMap[s.enrollmentNo] = s.id;
  });

  const marksReceived = [
    { uploadId: 1, studentId_num: 1, marksObtained: 18 },
    { uploadId: 1, studentId_num: 2, marksObtained: 15 },
    { uploadId: 1, studentId_num: 3, marksObtained: 17 },
    { uploadId: 1, studentId_num: 4, marksObtained: 12 },
    { uploadId: 1, studentId_num: 5, marksObtained: 19 },
    { uploadId: 2, studentId_num: 1, marksObtained: 14 },
    { uploadId: 2, studentId_num: 2, marksObtained: 16 },
    { uploadId: 2, studentId_num: 3, marksObtained: 13 },
    { uploadId: 2, studentId_num: 4, marksObtained: 18 },
    { uploadId: 2, studentId_num: 5, marksObtained: 17 },
    { uploadId: 3, studentId_num: 1, marksObtained: 16 },
    { uploadId: 3, studentId_num: 2, marksObtained: 14 },
    { uploadId: 3, studentId_num: 3, marksObtained: 19 },
    { uploadId: 3, studentId_num: 4, marksObtained: 11 },
    { uploadId: 3, studentId_num: 5, marksObtained: 15 },
    { uploadId: 4, studentId_num: 1, marksObtained: 17 },
    { uploadId: 4, studentId_num: 2, marksObtained: 18 },
    { uploadId: 4, studentId_num: 3, marksObtained: 14 },
    { uploadId: 4, studentId_num: 4, marksObtained: 16 },
    { uploadId: 4, studentId_num: 5, marksObtained: 13 },
    { uploadId: 5, studentId_num: 1, marksObtained: 19 },
    { uploadId: 5, studentId_num: 2, marksObtained: 15 },
    { uploadId: 5, studentId_num: 3, marksObtained: 17 },
    { uploadId: 5, studentId_num: 4, marksObtained: 12 },
    { uploadId: 5, studentId_num: 5, marksObtained: 18 },
    { uploadId: 6, studentId_num: 1, marksObtained: 13 },
    { uploadId: 6, studentId_num: 2, marksObtained: 16 },
    { uploadId: 6, studentId_num: 3, marksObtained: 18 },
    { uploadId: 6, studentId_num: 4, marksObtained: 14 },
    { uploadId: 6, studentId_num: 5, marksObtained: 17 },
  ];

  for (const m of marksReceived) {
    const studentEnrollment = `IT202300${m.studentId_num}`;
    const studentId = studentMap[studentEnrollment];
    if (studentId) {
      await prisma.studentMarks.upsert({
        where: {
          uploadId_studentId: {
            uploadId: m.uploadId,
            studentId: studentId
          }
        },
        update: {
          marksObtained: m.marksObtained,
        },
        create: {
          studentId: studentId,
          uploadId: m.uploadId,
          marksObtained: m.marksObtained,
        },
      });
    }
  }

  console.log('Created marks records');

  // Create faculty-subject assignments
  const mathSubject = await prisma.subject.findUnique({ where: { code_semesterId: { code: '202000104', semesterId: 1 } } });
  
  await Promise.all([
    prisma.facultySubject.upsert({
      where: {
        facultyId_subjectId_divisionId: {
          facultyId: headFaculty?.id || 1,
          subjectId: dsaSubject?.id || 1,
          divisionId: 1,
        },
      },
      update: {},
      create: {
        facultyId: headFaculty?.id || 1,
        subjectId: dsaSubject?.id || 1,
        divisionId: 1,
      },
    }),
    prisma.facultySubject.upsert({
      where: {
        facultyId_subjectId_divisionId: {
          facultyId: headFaculty?.id || 1,
          subjectId: dbmsSubject?.id || 2,
          divisionId: 1,
        },
      },
      update: {},
      create: {
        facultyId: headFaculty?.id || 1,
        subjectId: dbmsSubject?.id || 2,
        divisionId: 1,
      },
    }),
  ]);

  console.log('Created faculty-subject assignments');

  console.log('Database seeding completed successfully!');
  console.log('\\nLogin credentials:');
  console.log('Admin: admin@itcollege.edu / admin123');
  console.log('Faculty: head.it@adit.ac.in / faculty123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
