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
