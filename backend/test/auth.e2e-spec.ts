import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, loginAs, ADMIN_CREDS, FACULTY_CREDS, STUDENT_CREDS } from './test-helpers';

// ================================================================
// 1. AUTH MODULE — E2E Tests
// ================================================================

describe('Auth Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  // ------------------------------------------------------------------
  // POST /auth/login
  // ------------------------------------------------------------------
  describe('POST /auth/login', () => {
    it('✅ Admin login succeeds with correct credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(ADMIN_CREDS)
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.role).toBe('ADMIN');
    });

    it('✅ Faculty login returns FACULTY role', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(FACULTY_CREDS)
        .expect(200);

      expect(res.body.user.role).toBe('FACULTY');
    });

    it('✅ Student login returns STUDENT role', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(STUDENT_CREDS)
        .expect(200);

      expect(res.body.user.role).toBe('STUDENT');
    });

    it('❌ Wrong password returns 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_CREDS.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('❌ Non-existent email returns 401', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'abc123' })
        .expect(401);
    });

    it('❌ Empty email returns 400 validation error', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: '', password: 'admin123' })
        .expect(400);
    });

    it('❌ Empty password returns 400 validation error', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN_CREDS.email, password: '' })
        .expect(400);
    });

    it('❌ Missing body returns 400', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  // ------------------------------------------------------------------
  // GET /auth/me
  // ------------------------------------------------------------------
  describe('GET /auth/me', () => {
    it('✅ Returns current user when authenticated', async () => {
      const token = await loginAs(app, ADMIN_CREDS.email, ADMIN_CREDS.password);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe(ADMIN_CREDS.email);
    });

    it('❌ Returns 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('❌ Returns 401 with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer totally-invalid-token')
        .expect(401);
    });
  });

  // ------------------------------------------------------------------
  // POST /auth/logout
  // ------------------------------------------------------------------
  describe('POST /auth/logout', () => {
    it('✅ Logout succeeds when authenticated', async () => {
      const token = await loginAs(app, FACULTY_CREDS.email, FACULTY_CREDS.password);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });
  });

  // ------------------------------------------------------------------
  // GET /auth/check-session
  // ------------------------------------------------------------------
  describe('GET /auth/check-session', () => {
    it('✅ Returns session info for authenticated user', async () => {
      const token = await loginAs(app, STUDENT_CREDS.email, STUDENT_CREDS.password);

      const res = await request(app.getHttpServer())
        .get('/auth/check-session')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });
});
