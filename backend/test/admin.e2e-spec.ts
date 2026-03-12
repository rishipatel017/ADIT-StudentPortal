import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, loginAs, ADMIN_CREDS, FACULTY_CREDS, STUDENT_CREDS } from './test-helpers';

// ================================================================
// 2. ADMIN MODULE — E2E Tests
// Tests: Semester, Division, Subject, Faculty, Student CRUD
// Security: Faculty & Student must NOT access admin endpoints
// ================================================================

describe('Admin Module (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let facultyToken: string;
  let studentToken: string;

  // IDs created during tests (used for cleanup / further tests)
  let createdSemesterId: number;
  let createdDivisionId: number;
  let createdSubjectId: number;
  let createdFacultyId: number;
  let createdStudentId: number;

  beforeAll(async () => {
    app = await createTestApp();
    adminToken   = await loginAs(app, ADMIN_CREDS.email,   ADMIN_CREDS.password);
    facultyToken = await loginAs(app, FACULTY_CREDS.email, FACULTY_CREDS.password);
    studentToken = await loginAs(app, STUDENT_CREDS.email, STUDENT_CREDS.password);
  });

  afterAll(async () => {
    await app.close();
  });

  // ------------------------------------------------------------------
  // Dashboard Stats
  // ------------------------------------------------------------------
  describe('GET /admin/dashboard/stats', () => {
    it('✅ Admin can get dashboard statistics', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('❌ Faculty cannot access admin dashboard stats', async () => {
      await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(403);
    });

    it('❌ Student cannot access admin dashboard stats', async () => {
      await request(app.getHttpServer())
        .get('/admin/dashboard/stats')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  // ------------------------------------------------------------------
  // Semester CRUD
  // ------------------------------------------------------------------
  describe('Semester Management', () => {
    it('✅ Admin can list all semesters', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/semesters')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ Admin can create a semester', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/semesters')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 8, departmentId: 1 })
        .expect(201);

      expect(res.body.number).toBe(8);
      createdSemesterId = res.body.id;
    });

    it('❌ Duplicate semester returns error', async () => {
      await request(app.getHttpServer())
        .post('/admin/semesters')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ number: 8, departmentId: 1 }) // same as above — unique constraint
        .expect((res) => {
          expect([400, 409, 500]).toContain(res.status);
        });
    });

    it('✅ Admin can get semester by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/admin/semesters/${createdSemesterId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdSemesterId);
    });

    it('✅ Admin can delete a semester', async () => {
      await request(app.getHttpServer())
        .delete(`/admin/semesters/${createdSemesterId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });

  // ------------------------------------------------------------------
  // Division CRUD
  // ------------------------------------------------------------------
  describe('Division Management', () => {
    it('✅ Admin can list all divisions', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/divisions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ Admin can create a division', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/divisions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'TEST-DIV', semesterId: 3 })
        .expect(201);

      expect(res.body.name).toBe('TEST-DIV');
      createdDivisionId = res.body.id;
    });

    it('❌ Duplicate division in same semester returns error', async () => {
      await request(app.getHttpServer())
        .post('/admin/divisions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'TEST-DIV', semesterId: 3 })
        .expect((res) => {
          expect([400, 409, 500]).toContain(res.status);
        });
    });

    it('✅ Admin can delete a division', async () => {
      await request(app.getHttpServer())
        .delete(`/admin/divisions/${createdDivisionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });

  // ------------------------------------------------------------------
  // Subject CRUD
  // ------------------------------------------------------------------
  describe('Subject Management', () => {
    it('✅ Admin can list all subjects', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ Admin can create a subject', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Subject',
          code: 'TSUB999',
          type: 'CORE',
          credits: 4,
          semesterId: 3,
        })
        .expect(201);

      expect(res.body.code).toBe('TSUB999');
      createdSubjectId = res.body.id;
    });

    it('✅ Admin can update a subject', async () => {
      const res = await request(app.getHttpServer())
        .put(`/admin/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Test Subject', credits: 3 })
        .expect(200);

      expect(res.body.credits).toBe(3);
    });

    it('✅ Admin can delete a subject', async () => {
      await request(app.getHttpServer())
        .delete(`/admin/subjects/${createdSubjectId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });

  // ------------------------------------------------------------------
  // Faculty CRUD
  // ------------------------------------------------------------------
  describe('Faculty Management', () => {
    it('✅ Admin can list all faculty', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ Admin can create a faculty member', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Faculty',
          email: `testfaculty_${Date.now()}@itcollege.edu`,
          designation: 'Lecturer',
          qualification: 'M.Tech',
          phone: '9876543210',
          joiningDate: '2024-01-01',
          departmentId: 1,
          password: 'Faculty@123',
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      createdFacultyId = res.body.id || res.body.faculty?.id;
    });

    it('✅ Admin can get faculty by ID', async () => {
      if (!createdFacultyId) return;

      const res = await request(app.getHttpServer())
        .get(`/admin/faculty/${createdFacultyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdFacultyId);
    });

    it('✅ Admin can delete a faculty member', async () => {
      if (!createdFacultyId) return;

      await request(app.getHttpServer())
        .delete(`/admin/faculty/${createdFacultyId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });

  // ------------------------------------------------------------------
  // Student CRUD
  // ------------------------------------------------------------------
  describe('Student Management', () => {
    it('✅ Admin can list all students', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ Admin can create a student', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Student',
          email: `teststudent_${Date.now()}@itcollege.edu`,
          enrollmentNo: `IT${Date.now()}`,
          semesterId: 3,
          divisionId: 1,
          departmentId: 1,
          password: 'Student@123',
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      createdStudentId = res.body.id || res.body.student?.id;
    });

    it('✅ Admin can delete a student', async () => {
      if (!createdStudentId) return;

      await request(app.getHttpServer())
        .delete(`/admin/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });

  // ------------------------------------------------------------------
  // Search
  // ------------------------------------------------------------------
  describe('GET /admin/search', () => {
    it('✅ Admin can search students by name', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/search?type=students&query=Rahul')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('✅ Admin can search faculty', async () => {
      await request(app.getHttpServer())
        .get('/admin/search?type=faculty&query=Ashwin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
