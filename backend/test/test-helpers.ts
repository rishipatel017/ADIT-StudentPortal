import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

// ================================================================
// Test helpers and shared state
// ================================================================

export let app: INestApplication;
export let adminToken: string;
export let facultyToken: string;
export let studentToken: string;

export const ADMIN_CREDS    = { email: 'admin@itcollege.edu',  password: 'admin123',   role: 'ADMIN'   };
export const FACULTY_CREDS  = { email: 'hod@itcollege.edu',    password: 'faculty123', role: 'FACULTY' };
export const STUDENT_CREDS  = { email: 'rahul@itcollege.edu',  password: 'student123', role: 'STUDENT' };

/**
 * Creates and bootstraps the full NestJS application with validation pipe,
 * identical to main.ts setup. Call this in a global beforeAll.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const testApp = moduleFixture.createNestApplication();
  testApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await testApp.init();
  return testApp;
}

/**
 * Logs in with the given credentials and returns the JWT token.
 */
export async function loginAs(
  testApp: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  const res = await request(testApp.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return res.body.token || res.body.access_token;
}


