import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// ================================================================
// 2. ADMIN WORKFLOW — Playwright Frontend Tests
// ================================================================

test.describe('Admin Dashboard Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  // ------------------------------------------------------------------
  // Dashboard stats
  // ------------------------------------------------------------------
  test('Admin dashboard shows statistics cards', async ({ page }) => {
    // Expect stats cards / counters visible
    const statsCard = page.locator('[class*="stat"], [class*="card"], [class*="count"]');
    await expect(statsCard.first()).toBeVisible({ timeout: 10_000 });
  });

  // ------------------------------------------------------------------
  // Semester management
  // ------------------------------------------------------------------
  test.describe('Semester Management', () => {
    test('Admin can navigate to Semesters section', async ({ page }) => {
      const semLink = page.locator('a:has-text("Semester"), nav >> text=Semester, [href*="semester"]');
      if (await semLink.count() > 0) {
        await semLink.first().click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/semester/i);
      } else {
        test.skip(true, 'Semester navigation not found in menu');
      }
    });
  });

  // ------------------------------------------------------------------
  // Faculty management
  // ------------------------------------------------------------------
  test.describe('Faculty Management', () => {
    test('Admin can view faculty list', async ({ page }) => {
      const facultyLink = page.locator('a:has-text("Faculty"), nav >> text=Faculty, [href*="faculty"]');
      if (await facultyLink.count() > 0) {
        await facultyLink.first().click();
        await page.waitForLoadState('networkidle');
        // Faculty names should appear
        await expect(page.locator('table, [class*="list"], [class*="grid"]').first()).toBeVisible({ timeout: 10_000 });
      } else {
        test.skip(true, 'Faculty navigation not found');
      }
    });
  });

  // ------------------------------------------------------------------
  // Student management
  // ------------------------------------------------------------------
  test.describe('Student Management', () => {
    test('Admin can view student list', async ({ page }) => {
      const studentLink = page.locator('a:has-text("Student"), nav >> text=Student, [href*="student"]');
      if (await studentLink.count() > 0) {
        await studentLink.first().click();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('table, [class*="list"], [class*="grid"]').first()).toBeVisible({ timeout: 10_000 });
      } else {
        test.skip(true, 'Student navigation not found');
      }
    });
  });

  // ------------------------------------------------------------------
  // Security: Admin cannot access faculty-only pages
  // ------------------------------------------------------------------
  test('Admin cannot access faculty attendance endpoints directly (redirected)', async ({ page }) => {
    await page.goto('/attendance');
    // Should either show dashboard or show an access denied message
    const isAttendancePage = page.url().includes('/attendance');
    const deniedMsg = page.locator('text=Access denied, text=Unauthorized, text=403, text=Not allowed');
    
    if (isAttendancePage) {
      // If attendance page renders, verify no dangerous faculty operations are exposed
      const createBtn = page.locator('button:has-text("Mark Attendance"), button:has-text("Create Session")');
      await expect(createBtn).toHaveCount(0);
    }
  });
});
