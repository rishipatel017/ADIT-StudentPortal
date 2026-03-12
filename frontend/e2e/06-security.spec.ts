import { test, expect, Page } from '@playwright/test';
import { loginAs } from './helpers';

// ================================================================
// 6. SECURITY & ROLE-BASED ACCESS — Playwright Frontend Tests
// Ensures each role can ONLY see/do what they're authorized to do.
// ================================================================

// ------------------------------------------------------------------
// Helper: verify a page shows access denied or redirects away
// ------------------------------------------------------------------
async function expectRestricted(page: Page, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');

  const currentUrl = page.url();
  const isRedirectedAway = !currentUrl.includes(url.replace('/', ''));
  const showsDenied = await page.locator('text=Access denied, text=Unauthorized, text=403, text=Forbidden, text=Not allowed').count() > 0;
  const redirectedToLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');

  // Either page redirected OR shows an access-denied message
  expect(isRedirectedAway || showsDenied || redirectedToLogin).toBeTruthy();
}

// ------------------------------------------------------------------
// STUDENT — must NOT be able to access admin or faculty-only pages
// ------------------------------------------------------------------
test.describe('Security: Student cannot access restricted pages', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'student');
  });

  test('Student cannot access Admin Dashboard', async ({ page }) => {
    await expectRestricted(page, '/admin');
  });

  test('Student cannot access marks upload page', async ({ page }) => {
    await page.goto('/marks');
    await page.waitForLoadState('networkidle');

    // If the page loads, upload button should NOT exist
    const uploadBtn = page.locator('button:has-text("Upload"), input[type="file"][name*="marks"]');
    // Allow file inputs for other purposes but marks-specific upload should not exist
    const marksUpload = page.locator('[data-testid="upload-marks"], button:has-text("Upload Marks")');
    await expect(marksUpload).toHaveCount(0);
  });

  test('Student does not see Create Assignment button', async ({ page }) => {
    await page.goto('/assignments');
    await page.waitForLoadState('networkidle');

    const createBtn = page.locator('button:has-text("Create Assignment"), [data-testid="create-assignment"]');
    await expect(createBtn).toHaveCount(0);
  });

  test('Student does not see Attendance Mark buttons', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');

    const markBtn = page.locator('button:has-text("Submit Attendance"), button:has-text("Mark Session")');
    await expect(markBtn).toHaveCount(0);
  });
});

// ------------------------------------------------------------------
// FACULTY — must NOT be able to access admin pages
// ------------------------------------------------------------------
test.describe('Security: Faculty cannot access admin pages', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'faculty');
  });

  test('Faculty cannot access admin panel', async ({ page }) => {
    await expectRestricted(page, '/admin');
  });

  test('Faculty cannot see student management in sidebar', async ({ page }) => {
    // Admin-only sidebar items
    const adminLinks = page.locator(
      'a[href*="admin/students"], a[href*="admin/faculty"], a[href*="admin/semesters"]'
    );
    await expect(adminLinks).toHaveCount(0);
  });
});

// ------------------------------------------------------------------
// Unauthenticated users
// ------------------------------------------------------------------
test.describe('Security: Unauthenticated access is blocked', () => {

  test('Unauthenticated user redirect to login from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/login|auth/i, { timeout: 10_000 });
  });

  test('Unauthenticated user redirect to login from attendance', async ({ page }) => {
    await page.goto('/attendance');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/login|auth/i, { timeout: 10_000 });
  });

  test('Unauthenticated user redirect to login from assignments', async ({ page }) => {
    await page.goto('/assignments');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/login|auth/i, { timeout: 10_000 });
  });

  test('Unauthenticated user redirect to login from marks', async ({ page }) => {
    await page.goto('/marks');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/login|auth/i, { timeout: 10_000 });
  });
});
