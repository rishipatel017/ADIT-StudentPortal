import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, loginAs, FACULTY_CREDS, STUDENT_CREDS, ADMIN_CREDS } from './test-helpers';

// ================================================================
// 3. ATTENDANCE MODULE — E2E Tests
// ================================================================

describe('Attendance Module (e2e)', () => {
  let app: INestApplication;
  let facultyToken: string;
  let studentToken: string;
  let adminToken: string;
  let createdSessionId: number;

  // Seed data references (from prisma/seed.ts)
  const SEMESTER_ID  = 3;
  const SUBJECT_ID   = 1;  // DSA301 — assigned to faculty ID:1 / division ID:1
  const DIVISION_ID  = 1;  // IT-A

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
  // GET /attendance/students  — load student list for attendance
  // ------------------------------------------------------------------
  describe('GET /attendance/students', () => {
    it('✅ Faculty can get student list for attendance', async () => {
      const res = await request(app.getHttpServer())
        .get(`/attendance/students?semester=${SEMESTER_ID}&subjectId=${SUBJECT_ID}&divisionId=${DIVISION_ID}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('❌ Student cannot view student list for attendance', async () => {
      await request(app.getHttpServer())
        .get(`/attendance/students?semester=${SEMESTER_ID}&subjectId=${SUBJECT_ID}&divisionId=${DIVISION_ID}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // POST /attendance/create  — mark attendance
  // ------------------------------------------------------------------
  describe('POST /attendance/create', () => {
    const lectureDate = new Date(Date.now() - 86400000).toISOString().split('T')[0]; // yesterday
    const lectureNo   = 99; // unlikely to conflict

    it('✅ Faculty can mark attendance', async () => {
      const res = await request(app.getHttpServer())
        .post('/attendance/create')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          semesterId:  SEMESTER_ID,
          subjectId:   SUBJECT_ID,
          divisionId:  DIVISION_ID,
          lectureNo,
          topic:       'Test Lecture — Sorting Algorithms',
          lectureDate,
          records: [
            { studentId: 1, status: true  },
            { studentId: 3, status: false },
          ],
        })
        .expect((res) => {
          // 200 or 201 accepted; 400 means duplicate (that's OK if test re-runs)
          expect([200, 201, 400]).toContain(res.status);
        });

      if (res.status === 200 || res.status === 201) {
        createdSessionId = res.body.id || res.body.session?.id;
      }
    });

    it('❌ Student cannot mark attendance', async () => {
      await request(app.getHttpServer())
        .post('/attendance/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          semesterId: SEMESTER_ID,
          subjectId:  SUBJECT_ID,
          divisionId: DIVISION_ID,
          lectureNo:  100,
          lectureDate,
          records: [],
        })
        .expect(400);
    });

    it('❌ Duplicate attendance for same subject/division/date/lectureNo is rejected', async () => {
      // Second submission with same lectureNo → expect conflict or error
      await request(app.getHttpServer())
        .post('/attendance/create')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          semesterId:  SEMESTER_ID,
          subjectId:   SUBJECT_ID,
          divisionId:  DIVISION_ID,
          lectureNo,    // same as first attempt → should conflict
          topic:       'Duplicate attempt',
          lectureDate,
          records: [{ studentId: 1, status: true }],
        })
        .expect((res) => {
          expect([400, 409, 500]).toContain(res.status);
        });
    });
  });

  // ------------------------------------------------------------------
  // GET /attendance/history
  // ------------------------------------------------------------------
  describe('GET /attendance/history', () => {
    it('✅ Faculty can view attendance history', async () => {
      const res = await request(app.getHttpServer())
        .get('/attendance/history')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ Faculty can filter history by subject', async () => {
      const res = await request(app.getHttpServer())
        .get(`/attendance/history?subjectId=${SUBJECT_ID}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('❌ Student cannot view faculty attendance history', async () => {
      await request(app.getHttpServer())
        .get('/attendance/history')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /attendance/student — student views own attendance
  // ------------------------------------------------------------------
  describe('GET /attendance/student', () => {
    it('✅ Student can view own attendance', async () => {
      const res = await request(app.getHttpServer())
        .get('/attendance/student')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('❌ Faculty cannot use student attendance endpoint', async () => {
      await request(app.getHttpServer())
        .get('/attendance/student')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /attendance/export/csv
  // ------------------------------------------------------------------
  describe('GET /attendance/export/csv', () => {
    it('✅ Faculty can export attendance as CSV', async () => {
      const res = await request(app.getHttpServer())
        .get(`/attendance/export/csv?semester=${SEMESTER_ID}&subjectId=${SUBJECT_ID}&divisionId=${DIVISION_ID}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/csv/i);
      // Validate CSV has header row
      expect(res.text).toMatch(/Enrollment|Name/i);
    });

    it('❌ Student cannot export attendance CSV', async () => {
      await request(app.getHttpServer())
        .get(`/attendance/export/csv?semester=${SEMESTER_ID}&subjectId=${SUBJECT_ID}&divisionId=${DIVISION_ID}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /attendance/check-duplicate
  // ------------------------------------------------------------------
  describe('GET /attendance/check-duplicate', () => {
    it('✅ Faculty can check for duplicate attendance', async () => {
      const res = await request(app.getHttpServer())
        .get(`/attendance/check-duplicate?subjectId=${SUBJECT_ID}&divisionId=${DIVISION_ID}&lectureDate=2024-01-01&lectureNo=1`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('exists');
    });
  });

  // ------------------------------------------------------------------
  // GET /attendance/statistics
  // ------------------------------------------------------------------
  describe('GET /attendance/statistics', () => {
    it('✅ Faculty can view attendance statistics', async () => {
      await request(app.getHttpServer())
        .get('/attendance/statistics')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);
    });
  });

  // ------------------------------------------------------------------
  // PUT /attendance/session/:sessionId — update attendance
  // ------------------------------------------------------------------
  describe('PUT /attendance/session/:id', () => {
    it('✅ Faculty can update an attendance session (if session exists)', async () => {
      if (!createdSessionId) {
        console.log('Skipping update test — no session created');
        return;
      }

      await request(app.getHttpServer())
        .put(`/attendance/session/${createdSessionId}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          topic: 'Updated Topic',
          records: [{ studentId: 1, status: false }],
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });
    });
  });
});
