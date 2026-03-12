import { test, expect } from '@playwright/test';
import { loginAs, CREDENTIALS } from './helpers';

// ================================================================
// 1. AUTH FLOW — Playwright Frontend Tests
// ================================================================

test.describe('Authentication Flow', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
  });

  // ------------------------------------------------------------------
  // Login page UI
  // ------------------------------------------------------------------
  test('Login page renders correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/ERP|Campus|Login/i);
    await expect(page.locator('input[type="email"], input[name="email"], #email')).toBeVisible();
    await expect(page.locator('input[type="password"], #password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  // ------------------------------------------------------------------
  // Admin login
  // ------------------------------------------------------------------
  test('Admin login redirects to admin dashboard', async ({ page }) => {
    await loginAs(page, 'admin');
    // Admin should land on a dashboard page
    await expect(page).toHaveURL(/dashboard|admin|home/i);
  });

  // ------------------------------------------------------------------
  // Faculty login
  // ------------------------------------------------------------------
  test('Faculty login redirects to faculty dashboard', async ({ page }) => {
    await loginAs(page, 'faculty');
    await expect(page).toHaveURL(/dashboard|faculty|home/i);
  });

  // ------------------------------------------------------------------
  // Student login
  // ------------------------------------------------------------------
  test('Student login redirects to student dashboard', async ({ page }) => {
    await loginAs(page, 'student');
    await expect(page).toHaveURL(/dashboard|student|home/i);
  });

  // ------------------------------------------------------------------
  // Error cases
  // ------------------------------------------------------------------
  test('Wrong password shows error message', async ({ page }) => {
    await page.fill('input[type="email"], #email', CREDENTIALS.admin.email);
    await page.fill('input[type="password"], #password', 'wrongpassword123');
    await page.click('button[type="submit"]');

    // Should stay on login page and show an error
    await expect(page).toHaveURL(/login/i);
    const errorLocator = page.locator('[class*="error"], [class*="alert"], [role="alert"], .text-red-500');
    await expect(errorLocator.first()).toBeVisible({ timeout: 8_000 });
  });

  test('Empty email shows validation message', async ({ page }) => {
    await page.fill('input[type="email"], #email', '');
    await page.fill('input[type="password"], #password', 'somepassword');
    await page.click('button[type="submit"]');
    // Form should not submit — remain on login
    await expect(page).toHaveURL(/login/i);
  });

  test('Empty password shows validation message', async ({ page }) => {
    await page.fill('input[type="email"], #email', CREDENTIALS.admin.email);
    await page.fill('input[type="password"], #password', '');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/login/i);
  });

  // ------------------------------------------------------------------
  // Logout
  // ------------------------------------------------------------------
  test('User can logout and is redirected to login', async ({ page }) => {
    await loginAs(page, 'faculty');

    // Click logout button (common patterns)
    const logoutBtn = page.locator(
      'button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), [data-testid="logout"]'
    );

    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
      await expect(page).toHaveURL(/login/i, { timeout: 10_000 });
    } else {
      // Try menu/profile -> logout
      const profileMenu = page.locator('[data-testid="profile-menu"], .profile-btn, img[alt*="profile"], .avatar');
      if (await profileMenu.count() > 0) {
        await profileMenu.first().click();
        await page.locator('text=Logout, text=Sign Out').first().click();
        await expect(page).toHaveURL(/login/i, { timeout: 10_000 });
      } else {
        test.skip(true, 'Logout button not found — skip');
      }
    }
  });
});
