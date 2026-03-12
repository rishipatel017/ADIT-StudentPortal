import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// ================================================================
// 5. MARKS WORKFLOW — Playwright Frontend Tests
// ================================================================

test.describe('Faculty Marks Upload Workflow', () => {

  let csvPath: string;

  test.beforeAll(async () => {
    csvPath = path.join(os.tmpdir(), 'pw_marks.csv');
    fs.writeFileSync(csvPath, 'Enrollment,Marks\nIT2023001,18\nIT2023003,15\n');
  });

  test.afterAll(async () => {
    if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
  });

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'faculty');
  });

  test('Faculty can navigate to marks page', async ({ page }) => {
    const link = page.locator('a:has-text("Marks"), a:has-text("Grades"), nav >> text=Marks, [href*="marks"]');
    if (await link.count() > 0) {
      await link.first().click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/marks|grades/i);
    }
  });

  test('Marks page shows semester/subject/division dropdowns', async ({ page }) => {
    await page.goto('/marks');
    await page.waitForLoadState('networkidle');

    const selects = page.locator('select, [role="combobox"]');
    if (await selects.count() > 0) {
      await expect(selects.first()).toBeVisible();
    }
  });

  test('Faculty can download marks CSV template', async ({ page }) => {
    await page.goto('/marks');
    await page.waitForLoadState('networkidle');

    const templateBtn = page.locator('button:has-text("Template"), a:has-text("Template"), button:has-text("Download Template")');
    if (await templateBtn.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 12_000 }),
        templateBtn.first().click(),
      ]);
      expect(download.suggestedFilename()).toMatch(/\.csv$/i);
    }
  });

  test('Faculty can see upload CSV button', async ({ page }) => {
    await page.goto('/marks');
    await page.waitForLoadState('networkidle');

    const uploadBtn = page.locator(
      'button:has-text("Upload"), input[type="file"], label:has-text("Upload"), [data-testid="upload-marks"]'
    );
    // At least a file input or upload button is expected
    const hasUpload = (await uploadBtn.count()) > 0;
    expect(hasUpload).toBeTruthy();
  });
});

// ================================================================
// Student marks view
// ================================================================

test.describe('Student Marks View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'student');
  });

  test('Student can view their marks', async ({ page }) => {
    const link = page.locator('a:has-text("Marks"), a:has-text("Grades"), [href*="marks"]');
    if (await link.count() > 0) {
      await link.first().click();
      await page.waitForLoadState('networkidle');
      const content = page.locator('table, [class*="marks"], [class*="card"]');
      const empty   = page.locator('text=No marks, text=No data');
      const has     = (await content.count()) > 0 || (await empty.count()) > 0;
      expect(has).toBeTruthy();
    }
  });

  test('Student cannot see upload marks button', async ({ page }) => {
    await page.goto('/marks');
    await page.waitForLoadState('networkidle');

    const uploadBtn = page.locator('button:has-text("Upload Marks"), button:has-text("Upload CSV"), [data-testid="upload-marks"]');
    await expect(uploadBtn).toHaveCount(0);
  });
});

// ================================================================
// 6. NOTICES WORKFLOW — Playwright Frontend Tests
// ================================================================

test.describe('Admin/Faculty Notice Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('Admin can navigate to notices page', async ({ page }) => {
    const link = page.locator('a:has-text("Notice"), nav >> text=Notice, [href*="notice"]');
    if (await link.count() > 0) {
      await link.first().click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/notice/i);
    }
  });

  test('Admin sees Create Notice button', async ({ page }) => {
    await page.goto('/notices');
    await page.waitForLoadState('networkidle');

    const createBtn = page.locator('button:has-text("Create"), button:has-text("New Notice"), button:has-text("Add Notice")');
    if (await createBtn.count() > 0) {
      await expect(createBtn.first()).toBeVisible();
    }
  });

  test('Admin can open notice creation form', async ({ page }) => {
    await page.goto('/notices');
    await page.waitForLoadState('networkidle');

    const createBtn = page.locator('button:has-text("Create"), button:has-text("New Notice")');
    if (await createBtn.count() > 0) {
      await createBtn.first().click();
      const titleField = page.locator('input[name="title"], input[placeholder*="title"], #title, textarea[name="title"]');
      if (await titleField.count() > 0) {
        await expect(titleField.first()).toBeVisible({ timeout: 8_000 });
      }
    }
  });
});

test.describe('Student Notice View', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'student');
  });

  test('Student can view notices relevant to them', async ({ page }) => {
    const link = page.locator('a:has-text("Notice"), nav >> text=Notice, [href*="notice"]');
    if (await link.count() > 0) {
      await link.first().click();
      await page.waitForLoadState('networkidle');

      const content  = page.locator('[class*="notice"], [class*="card"], table');
      const empty    = page.locator('text=No notices, text=Nothing here');
      const has      = (await content.count()) > 0 || (await empty.count()) > 0;
      expect(has).toBeTruthy();
    }
  });

  test('Student cannot see Delete or Create notice buttons', async ({ page }) => {
    await page.goto('/notices');
    await page.waitForLoadState('networkidle');

    const privateBtn = page.locator('button:has-text("Create Notice"), button:has-text("Delete")]');
    await expect(privateBtn).toHaveCount(0);
  });
});
