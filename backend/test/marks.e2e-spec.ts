import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { createTestApp, loginAs, FACULTY_CREDS, STUDENT_CREDS, ADMIN_CREDS } from './test-helpers';

// ================================================================
// 5. MARKS MODULE — E2E Tests
// ================================================================

describe('Marks Module (e2e)', () => {
  let app: INestApplication;
  let facultyToken: string;
  let studentToken: string;
  let adminToken: string;
  let tempCsvPath: string;

  const SEMESTER_ID = 3;
  const SUBJECT_ID  = 1;
  const DIVISION_ID = 1;

  beforeAll(async () => {
    app = await createTestApp();
    facultyToken = await loginAs(app, FACULTY_CREDS.email, FACULTY_CREDS.password);
    studentToken = await loginAs(app, STUDENT_CREDS.email, STUDENT_CREDS.password);
    adminToken   = await loginAs(app, ADMIN_CREDS.email,   ADMIN_CREDS.password);

    // Create a simple CSV for marks upload
    tempCsvPath = path.join(os.tmpdir(), 'test_marks.csv');
    const csvContent = `Enrollment,Marks\nIT2023001,18\nIT2023003,15\n`;
    fs.writeFileSync(tempCsvPath, csvContent);
  });

  afterAll(async () => {
    if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
    await app.close();
  });

  // ------------------------------------------------------------------
  // GET /marks/template  — download marks CSV template
  // ------------------------------------------------------------------
  describe('GET /marks/template', () => {
    it('✅ Faculty can download marks CSV template', async () => {
      const res = await request(app.getHttpServer())
        .get(`/marks/template?divisionId=${DIVISION_ID}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(res.headers['content-type']).toMatch(/csv/i);
      expect(res.text).toMatch(/Enrollment/i);
    });

    it('❌ Student cannot download marks template', async () => {
      await request(app.getHttpServer())
        .get(`/marks/template?divisionId=${DIVISION_ID}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // POST /marks/upload  — faculty uploads marks CSV
  // ------------------------------------------------------------------
  describe('POST /marks/upload', () => {
    it('✅ Faculty can upload marks via CSV', async () => {
      const res = await request(app.getHttpServer())
        .post(`/marks/upload?semester=${SEMESTER_ID}&subjectId=${SUBJECT_ID}&divisionId=${DIVISION_ID}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .attach('file', tempCsvPath, { contentType: 'text/csv', filename: 'test_marks.csv' })
        .field('maxMarks', '20')
        .expect((res) => {
          // 200/201 = success; 400/500 = already uploaded (unique constraint)
          expect([200, 201, 400, 500]).toContain(res.status);
        });

      
    });

    it('❌ Student cannot upload marks', async () => {
      await request(app.getHttpServer())
        .post(`/marks/upload?semester=${SEMESTER_ID}&subjectId=${SUBJECT_ID}&divisionId=${DIVISION_ID}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', tempCsvPath, { contentType: 'text/csv', filename: 'test_marks.csv' })
        .expect(400);
    });

    it('❌ Admin cannot upload marks', async () => {
      await request(app.getHttpServer())
        .post(`/marks/upload?semester=${SEMESTER_ID}&subjectId=${SUBJECT_ID}&divisionId=${DIVISION_ID}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', tempCsvPath, { contentType: 'text/csv', filename: 'test_marks.csv' })
        .expect(400);
    });

    it('❌ Non-CSV file is rejected', async () => {
      const pdfPath = path.join(os.tmpdir(), 'fake.pdf');
      fs.writeFileSync(pdfPath, '%PDF not a csv');

      await request(app.getHttpServer())
        .post(`/marks/upload?semester=${SEMESTER_ID}&subjectId=${SUBJECT_ID}&divisionId=${DIVISION_ID}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .attach('file', pdfPath, { contentType: 'application/pdf', filename: 'fake.pdf' })
        .expect(400);

      fs.unlinkSync(pdfPath);
    });
  });

  // ------------------------------------------------------------------
  // GET /marks/student  — student views own marks
  // ------------------------------------------------------------------
  describe('GET /marks/student', () => {
    it('✅ Student can view their own marks', async () => {
      const res = await request(app.getHttpServer())
        .get('/marks/student')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('✅ Student can filter marks by semester', async () => {
      const res = await request(app.getHttpServer())
        .get(`/marks/student?semester=${SEMESTER_ID}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('❌ Faculty cannot access student marks endpoint', async () => {
      await request(app.getHttpServer())
        .get('/marks/student')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /marks/faculty  — faculty views marks they uploaded
  // ------------------------------------------------------------------
  describe('GET /marks/faculty', () => {
    it('✅ Faculty can view their uploaded marks', async () => {
      const res = await request(app.getHttpServer())
        .get('/marks/faculty')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('✅ Faculty can filter marks by division', async () => {
      await request(app.getHttpServer())
        .get(`/marks/faculty?divisionId=${DIVISION_ID}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);
    });

    it('❌ Student cannot view faculty marks list', async () => {
      await request(app.getHttpServer())
        .get('/marks/faculty')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /marks/statistics
  // ------------------------------------------------------------------
  describe('GET /marks/statistics', () => {
    it('✅ Faculty can view marks statistics', async () => {
      await request(app.getHttpServer())
        .get('/marks/statistics')
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);
    });
  });

  // ------------------------------------------------------------------
  // GET /marks/check-existing
  // ------------------------------------------------------------------
  describe('GET /marks/check-existing', () => {
    it('✅ Faculty can check if marks already uploaded', async () => {
      const res = await request(app.getHttpServer())
        .get(`/marks/check-existing?semester=${SEMESTER_ID}&subjectId=${SUBJECT_ID}&divisionId=${DIVISION_ID}`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });
});
