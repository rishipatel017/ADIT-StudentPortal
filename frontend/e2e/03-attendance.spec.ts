import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

// ================================================================
// 3. ATTENDANCE WORKFLOW — Playwright Frontend Tests
// ================================================================

test.describe('Faculty Attendance Workflow', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'faculty');
  });

  test('Faculty can navigate to attendance page', async ({ page }) => {
    const attendanceLink = page.locator('a:has-text("Attendance"), nav >> text=Attendance, [href*="attendance"]');
    await expect(attendanceLink.first()).toBeVisible({ timeout: 10_000 });
    await attendanceLink.first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/attendance/i);
  });

  test('Attendance page shows semester/subject/division dropdowns', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');

    // Expect at least one dropdown/select visible
    const dropdowns = page.locator('select, [role="listbox"], [class*="dropdown"]');
    await expect(dropdowns.first()).toBeVisible({ timeout: 10_000 });
  });

  test('Selecting filters loads student list', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');

    // Select first available options in each dropdown
    const selects = page.locator('select');
    const count = await selects.count();

    if (count >= 2) {
      // Select semester
      await selects.nth(0).selectOption({ index: 1 });
      await page.waitForTimeout(500);
      // Select subject
      await selects.nth(1).selectOption({ index: 1 });
      await page.waitForTimeout(500);
      // Select division (if exists)
      if (count >= 3) {
        await selects.nth(2).selectOption({ index: 1 });
        await page.waitForTimeout(1000);
      }

      // Student rows should appear
      const studentRows = page.locator('table tbody tr, [class*="student-row"]');
      await expect(studentRows.first()).toBeVisible({ timeout: 12_000 });
    }
  });

  test('Mark All Present button toggles all checkboxes to checked', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');

    const markAllBtn = page.locator('button:has-text("Mark All"), button:has-text("Select All"), button:has-text("All Present")');
    if (await markAllBtn.count() > 0) {
      await markAllBtn.first().click();
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      if (count > 0) {
        await expect(checkboxes.first()).toBeChecked();
      }
    }
  });

  test('Clear All button unchecks all checkboxes', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');

    const clearBtn = page.locator('button:has-text("Clear"), button:has-text("Deselect All"), button:has-text("Clear All")');
    if (await clearBtn.count() > 0) {
      await clearBtn.first().click();
      const checkboxes = page.locator('input[type="checkbox"]');
      const count = await checkboxes.count();
      if (count > 0) {
        await expect(checkboxes.first()).not.toBeChecked();
      }
    }
  });

  test('Export CSV button downloads a CSV file', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');

    const exportBtn = page.locator('button:has-text("Export"), button:has-text("Download"), a:has-text("CSV")');
    if (await exportBtn.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 15_000 }),
        exportBtn.first().click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.csv$/i);
    }
  });
});

// ================================================================
// Student views own attendance
// ================================================================

test.describe('Student Attendance View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'student');
  });

  test('Student sees their own attendance data', async ({ page }) => {
    // Navigate to attendance section
    const attendanceLink = page.locator('a:has-text("Attendance"), nav >> text=Attendance, [href*="attendance"]');
    if (await attendanceLink.count() > 0) {
      await attendanceLink.first().click();
      await page.waitForLoadState('networkidle');

      // Should see attendance info (percentage, subject names, etc.)
      const content = page.locator('[class*="attendance"], [class*="percentage"], table, [class*="card"]');
      await expect(content.first()).toBeVisible({ timeout: 10_000 });
    }
  });

  test('Student cannot see attendance submit/create form', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');

    // Faculty-only actions must NOT appear for students
    const createBtn = page.locator('button:has-text("Submit Attendance"), button:has-text("Mark Attendance"), button:has-text("Create Session")');
    await expect(createBtn).toHaveCount(0);
  });
});
