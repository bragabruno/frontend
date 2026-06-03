import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('mat-card-title, h1')).toContainText(/Fraud Prevention|Sign In/);
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
  });
});

test.describe('Navigation', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/cases');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Session persistence', () => {
  test('should stay authenticated after a page reload', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Successful login lands on the case queue and the queue actually renders.
    await expect(page).toHaveURL(/\/cases/);
    await expect(page.locator('h1')).toContainText('Case Queue');
    await expect(page.locator('table[mat-table]')).toBeVisible();

    // Reload: the persisted refresh token should restore the session via /auth/me
    // before the route guard runs, so the user is not bounced back to /login.
    await page.reload();
    await expect(page).toHaveURL(/\/cases/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('table[mat-table]')).toBeVisible();
  });
});
