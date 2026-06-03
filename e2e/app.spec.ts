import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should display login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('mat-card-title')).toContainText('Fraud Prevention System');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Sign In');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/cases');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'wrong');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');
    await expect(page.locator('.error-message')).toBeVisible();
  });
});

test.describe('Case Queue', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/cases');
  });

  test('should display case list table', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th')).toHaveCount(8);
  });

  test('should have filter controls', async ({ page }) => {
    await expect(page.locator('mat-form-field')).toHaveCount(2);
  });

  test('should navigate to case detail on row click', async ({ page }) => {
    const firstRow = page.locator('tr.clickable-row').first();
    await firstRow.click();
    await expect(page).toHaveURL(/\/cases\/[\w-]+/);
  });
});

test.describe('Case Detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/cases');

    const firstRow = page.locator('tr.clickable-row').first();
    await firstRow.click();
  });

  test('should display case summary', async ({ page }) => {
    await expect(page.locator('.summary-card')).toBeVisible();
    await expect(page.locator('.severity-badge')).toBeVisible();
    await expect(page.locator('.status-chip')).toBeVisible();
  });

  test('should display transaction details', async ({ page }) => {
    await expect(page.locator('text=Transaction')).toBeVisible();
  });

  test('should display risk score', async ({ page }) => {
    await expect(page.locator('text=Risk Score')).toBeVisible();
  });

  test('should have notes tab', async ({ page }) => {
    await expect(page.locator('text=Notes')).toBeVisible();
  });

  test('should have labels tab', async ({ page }) => {
    await expect(page.locator('text=Labels')).toBeVisible();
  });
});

test.describe('Role-Based Access', () => {
  test('AUDITOR should not see action buttons', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'auditor');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/cases');

    const firstRow = page.locator('tr.clickable-row').first();
    await firstRow.click();

    await expect(page.locator('text=Assign to Me')).not.toBeVisible();
  });

  test('ADMIN should access admin pages', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    await page.goto('/admin/users');
    await expect(page.locator('text=User Management')).toBeVisible();
  });
});
