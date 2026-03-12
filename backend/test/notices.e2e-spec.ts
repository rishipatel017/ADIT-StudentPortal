import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, loginAs, FACULTY_CREDS, STUDENT_CREDS, ADMIN_CREDS } from './test-helpers';

// ================================================================
// 6. NOTICES MODULE — E2E Tests
// ================================================================

describe('Notices Module (e2e)', () => {
  let app: INestApplication;
  let facultyToken: string;
  let studentToken: string;
  let adminToken: string;
  let createdNoticeId: number;

  beforeAll(async () => {
    app = await createTestApp();
    facultyToken = await loginAs(app, FACULTY_CREDS.email, FACULTY_CREDS.password);
    studentToken = await loginAs(app, STUDENT_CREDS.email, STUDENT_CREDS.password);
    adminToken   = await loginAs(app, ADMIN_CREDS.email,   ADMIN_CREDS.password);
  });

  afterAll(async () => {
    await app.close();
  });

  // ------------------------------------------------------------------
  // POST /notices  — Create a notice
  // ------------------------------------------------------------------
  describe('POST /notices', () => {
    it('✅ Admin can create a notice targeting students', async () => {
      const res = await request(app.getHttpServer())
        .post('/notices')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Admin Test Notice')
        .field('content', 'This is a test notice from admin for all students.')
        .field('semesterId', '3')
        .field('isForStudents', 'true')
        .field('isForFaculty', 'false')
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      createdNoticeId = res.body.id || res.body.notice?.id;
    });

    it('✅ Faculty can create a notice for their division', async () => {
      await request(app.getHttpServer())
        .post('/notices')
        .set('Authorization', `Bearer ${facultyToken}`)
        .field('title', 'Faculty Test Notice')
        .field('content', 'Assignment due tomorrow.')
        .field('semesterId', '3')
        .field('divisionId', '1')
        .field('isForStudents', 'true')
        .field('isForFaculty', 'false')
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });
    });

    it('❌ Student cannot create a notice', async () => {
      await request(app.getHttpServer())
        .post('/notices')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Student Hack Notice')
        .field('content', 'This should fail')
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /notices/student  — student sees their relevant notices
  // ------------------------------------------------------------------
  describe('GET /notices/student', () => {
    it('✅ Student can view notices relevant to them', async () => {
      const res = await request(app.getHttpServer())
        .get('/notices/student')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('❌ Faculty cannot access student notice endpoint', async () => {
      await request(app.getHttpServer())
        .get('/notices/student')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /notices/faculty  — faculty sees their notices
  // ------------------------------------------------------------------
  describe('GET /notices/faculty', () => {
    it('✅ Faculty can view faculty notices', async () => {
      const res = await request(app.getHttpServer())
        .get('/notices/faculty')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('❌ Student cannot access faculty notices endpoint', async () => {
      await request(app.getHttpServer())
        .get('/notices/faculty')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /notices/all  — admin/faculty can view all notices
  // ------------------------------------------------------------------
  describe('GET /notices/all', () => {
    it('✅ Admin can view all notices', async () => {
      const res = await request(app.getHttpServer())
        .get('/notices/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ Faculty can view all notices', async () => {
      await request(app.getHttpServer())
        .get('/notices/all')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);
    });

    it('❌ Student cannot access all-notices endpoint', async () => {
      await request(app.getHttpServer())
        .get('/notices/all')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /notices/:id  — get notice by ID
  // ------------------------------------------------------------------
  describe('GET /notices/:id', () => {
    it('✅ Admin can get a specific notice by ID', async () => {
      if (!createdNoticeId) return;

      const res = await request(app.getHttpServer())
        .get(`/notices/${createdNoticeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdNoticeId);
    });
  });

  // ------------------------------------------------------------------
  // PUT /notices/:id  — update a notice
  // ------------------------------------------------------------------
  describe('PUT /notices/:id', () => {
    it('✅ Admin can update a notice', async () => {
      if (!createdNoticeId) return;

      const res = await request(app.getHttpServer())
        .put(`/notices/${createdNoticeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Admin Test Notice', content: 'Updated content.' })
        .expect(200);

      expect(res.body.title).toBe('Updated Admin Test Notice');
    });

    it('❌ Student cannot update a notice', async () => {
      if (!createdNoticeId) return;

      await request(app.getHttpServer())
        .put(`/notices/${createdNoticeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Hacked Title' })
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // DELETE /notices/:id
  // ------------------------------------------------------------------
  describe('DELETE /notices/:id', () => {
    it('❌ Student cannot delete a notice', async () => {
      if (!createdNoticeId) return;

      await request(app.getHttpServer())
        .delete(`/notices/${createdNoticeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });

    it('✅ Admin can delete a notice', async () => {
      if (!createdNoticeId) return;

      await request(app.getHttpServer())
        .delete(`/notices/${createdNoticeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });

  // ------------------------------------------------------------------
  // GET /notices/statistics
  // ------------------------------------------------------------------
  describe('GET /notices/statistics', () => {
    it('✅ Admin can view notice statistics', async () => {
      await request(app.getHttpServer())
        .get('/notices/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });
});
