/**
 * Playwright test helpers for ADIT CampusHub ERP
 * Shared credentials, selectors, and login helpers
 */

export const BASE_URL = 'http://localhost:3000';

export const CREDENTIALS = {
  admin:   { email: 'admin@itcollege.edu',  password: 'admin123'   },
  faculty: { email: 'hod@itcollege.edu',    password: 'faculty123' },
  student: { email: 'rahul@itcollege.edu',  password: 'student123' },
};

/**
 * Fill in the login form and submit.
 * Works for all roles since they share the same login page.
 */
export async function loginAs(
  page: import('@playwright/test').Page,
  role: 'admin' | 'faculty' | 'student',
) {
  const { email, password } = CREDENTIALS[role];

  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');

  // Fill email
  await page.fill('input[type="email"], input[name="email"], #email', email);
  // Fill password
  await page.fill('input[type="password"], input[name="password"], #password', password);
  // Click submit
  await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');

  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15_000 });
}
