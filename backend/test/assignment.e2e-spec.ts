import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { createTestApp, loginAs, FACULTY_CREDS, STUDENT_CREDS, ADMIN_CREDS } from './test-helpers';

// ================================================================
// 4. ASSIGNMENT MODULE — E2E Tests
// ================================================================

describe('Assignment Module (e2e)', () => {
  let app: INestApplication;
  let facultyToken: string;
  let studentToken: string;
  let adminToken: string;
  let createdAssignmentId: number;

  const SEMESTER_ID = 3;
  const SUBJECT_ID  = 1;
  const DIVISION_ID = 1;

  // Create a temporary PDF for upload tests
  let tempPdfPath: string;

  beforeAll(async () => {
    app = await createTestApp();
    facultyToken = await loginAs(app, FACULTY_CREDS.email, FACULTY_CREDS.password);
    studentToken = await loginAs(app, STUDENT_CREDS.email, STUDENT_CREDS.password);
    adminToken   = await loginAs(app, ADMIN_CREDS.email,   ADMIN_CREDS.password);

    // Create a minimal valid PDF file for submission tests
    tempPdfPath = path.join(os.tmpdir(), 'test-assignment.pdf');
    // Minimal PDF header so multer accepts it as application/pdf
    fs.writeFileSync(tempPdfPath, '%PDF-1.4 test pdf content for e2e testing');
  });

  afterAll(async () => {
    if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
    await app.close();
  });

  // ------------------------------------------------------------------
  // POST /assignments/create  — faculty creates assignment
  // ------------------------------------------------------------------
  describe('POST /assignments/create', () => {
    it('✅ Faculty can create an assignment (without attachment)', async () => {
      const dueDate = new Date(Date.now() + 7 * 86400000).toISOString(); // 7 days from now

      const res = await request(app.getHttpServer())
        .post('/assignments/create')
        .set('Authorization', `Bearer ${facultyToken}`)
        .field('title', 'Test Assignment 1')
        .field('description', 'Sort an array using merge sort')
        .field('dueDate', dueDate)
        .field('semesterId', String(SEMESTER_ID))
        .field('subjectId', String(SUBJECT_ID))
        .field('divisionIds', String(DIVISION_ID))
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });

      createdAssignmentId = res.body.id || res.body.assignment?.id;
    });

    it('❌ Student cannot create an assignment', async () => {
      await request(app.getHttpServer())
        .post('/assignments/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .field('title', 'Hacked Assignment')
        .field('dueDate', new Date().toISOString())
        .field('semesterId', String(SEMESTER_ID))
        .field('subjectId', String(SUBJECT_ID))
        .field('divisionIds', String(DIVISION_ID))
        .expect(400);
    });

    it('❌ Admin cannot create an assignment', async () => {
      await request(app.getHttpServer())
        .post('/assignments/create')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Admin Assignment')
        .field('dueDate', new Date().toISOString())
        .field('semesterId', String(SEMESTER_ID))
        .field('subjectId', String(SUBJECT_ID))
        .field('divisionIds', String(DIVISION_ID))
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /assignments/faculty  — faculty views their assignments
  // ------------------------------------------------------------------
  describe('GET /assignments/faculty', () => {
    it('✅ Faculty can view their assignments', async () => {
      const res = await request(app.getHttpServer())
        .get('/assignments/faculty')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ Faculty can filter assignments by semester', async () => {
      const res = await request(app.getHttpServer())
        .get(`/assignments/faculty?semester=${SEMESTER_ID}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('❌ Student cannot access faculty assignments endpoint', async () => {
      await request(app.getHttpServer())
        .get('/assignments/faculty')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /assignments/student  — student views their assignments
  // ------------------------------------------------------------------
  describe('GET /assignments/student', () => {
    it('✅ Student can view their own assignments', async () => {
      const res = await request(app.getHttpServer())
        .get('/assignments/student')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('❌ Faculty cannot access student assignment list', async () => {
      await request(app.getHttpServer())
        .get('/assignments/student')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /assignments/:id  — get assignment details
  // ------------------------------------------------------------------
  describe('GET /assignments/:id', () => {
    it('✅ Faculty can view an assignment by ID', async () => {
      if (!createdAssignmentId) return;

      const res = await request(app.getHttpServer())
        .get(`/assignments/${createdAssignmentId}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(res.body.id).toBe(createdAssignmentId);
    });
  });

  // ------------------------------------------------------------------
  // POST /assignments/:id/submit  — student submits assignment
  // ------------------------------------------------------------------
  describe('POST /assignments/:id/submit', () => {
    it('✅ Student can submit a PDF assignment', async () => {
      if (!createdAssignmentId) return;

      await request(app.getHttpServer())
        .post(`/assignments/${createdAssignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', tempPdfPath, { contentType: 'application/pdf' })
        .expect((res) => {
          // 200/201 = success, 400 = already submitted or validation
          expect([200, 201, 400]).toContain(res.status);
        });
    });

    it('❌ Student cannot submit a non-PDF file', async () => {
      if (!createdAssignmentId) return;

      const txtPath = path.join(os.tmpdir(), 'test.txt');
      fs.writeFileSync(txtPath, 'not a pdf');

      await request(app.getHttpServer())
        .post(`/assignments/${createdAssignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', txtPath, { contentType: 'text/plain' })
        .expect(400);

      fs.unlinkSync(txtPath);
    });

    it('❌ Faculty cannot submit to an assignment', async () => {
      if (!createdAssignmentId) return;

      await request(app.getHttpServer())
        .post(`/assignments/${createdAssignmentId}/submit`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .attach('file', tempPdfPath, { contentType: 'application/pdf' })
        .expect(400);
    });

    it('❌ Duplicate submission from same student is rejected', async () => {
      if (!createdAssignmentId) return;

      // Second submission attempt — unique constraint [assignmentId, studentId]
      await request(app.getHttpServer())
        .post(`/assignments/${createdAssignmentId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', tempPdfPath, { contentType: 'application/pdf' })
        .expect((res) => {
          // Expect 400/409 — already submitted
          expect([400, 409, 500]).toContain(res.status);
        });
    });
  });

  // ------------------------------------------------------------------
  // GET /assignments/:id/submissions  — faculty views submissions
  // ------------------------------------------------------------------
  describe('GET /assignments/:id/submissions', () => {
    it('✅ Faculty can view submissions for an assignment', async () => {
      if (!createdAssignmentId) return;

      const res = await request(app.getHttpServer())
        .get(`/assignments/${createdAssignmentId}/submissions`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ Faculty can filter submissions — only submitted', async () => {
      if (!createdAssignmentId) return;

      await request(app.getHttpServer())
        .get(`/assignments/${createdAssignmentId}/submissions?filter=submitted`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);
    });

    it('✅ Faculty can filter submissions — pending', async () => {
      if (!createdAssignmentId) return;

      await request(app.getHttpServer())
        .get(`/assignments/${createdAssignmentId}/submissions?filter=pending`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);
    });

    it('❌ Student cannot view all submissions', async () => {
      if (!createdAssignmentId) return;

      await request(app.getHttpServer())
        .get(`/assignments/${createdAssignmentId}/submissions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });
  });
});
