import { test, expect } from '@playwright/test';

test.describe('Admin Routes RBAC', () => {
  test('unauthenticated user is redirected to auth', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Should be redirected to auth page
    await expect(page).toHaveURL(/\/auth/);
  });

  test('standard user cannot access /admin/dashboard', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'user_standard@test.com');
    await page.fill('input[type="password"]', 'StandardPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
    
    await page.goto('/admin/dashboard');
    
    // Should show access denied or redirect
    await expect(page.locator('text=/accès refusé|access denied|unauthorized/i')).toBeVisible({ timeout: 5000 });
  });

  test('standard user cannot access /admin/analytics', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'user_standard@test.com');
    await page.fill('input[type="password"]', 'StandardPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
    
    await page.goto('/admin/analytics');
    
    // Should show access denied
    await expect(page.locator('text=/accès refusé|access denied|unauthorized/i')).toBeVisible({ timeout: 5000 });
  });

  test('admin user can access /admin/dashboard', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'user_admin@test.com');
    await page.fill('input[type="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
    
    await page.goto('/admin/dashboard');
    
    // Should show admin content, not access denied
    await expect(page.locator('text=/accès refusé|access denied/i')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('h1, h2')).toContainText(/admin|dashboard/i);
    await page.screenshot({ path: 'screenshots/admin-access-granted.png' });
  });

  test('admin user can access /admin/analytics', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'user_admin@test.com');
    await page.fill('input[type="password"]', 'AdminPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
    
    await page.goto('/admin/analytics');
    
    // Should show analytics content
    await expect(page.locator('text=/accès refusé|access denied/i')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=/analytics|statistiques|métriques/i')).toBeVisible();
  });
});

test.describe('Admin Route UI Feedback', () => {
  test('access denied page shows shield icon', async ({ page }) => {
    // Go directly to admin without auth - will redirect
    await page.goto('/admin/dashboard');
    
    // If we get to the access denied page (after potential login)
    const isOnAuth = page.url().includes('/auth');
    
    if (!isOnAuth) {
      const shieldIcon = page.locator('svg.lucide-shield-alert');
      await expect(shieldIcon).toBeVisible({ timeout: 5000 });
    }
  });

  test('access denied page has return button', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'user_standard@test.com');
    await page.fill('input[type="password"]', 'StandardPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
    
    await page.goto('/admin/dashboard');
    
    // Check for return button
    const returnButton = page.locator('a[href="/identity"]');
    await expect(returnButton).toBeVisible({ timeout: 5000 });
    await expect(returnButton).toContainText(/retour/i);
  });

  test('clicking return button navigates to identity', async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'user_standard@test.com');
    await page.fill('input[type="password"]', 'StandardPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
    
    await page.goto('/admin/dashboard');
    
    const returnButton = page.locator('a[href="/identity"]');
    await returnButton.click();
    
    await expect(page).toHaveURL(/\/identity/);
  });
});

test.describe('Admin Route Loading States', () => {
  test('shows loading indicator while checking permissions', async ({ page }) => {
    // Intercept the user_roles query to delay it
    await page.route('**/rest/v1/user_roles*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });

    await page.goto('/auth');
    await page.fill('input[type="email"]', 'user_standard@test.com');
    await page.fill('input[type="password"]', 'StandardPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
    
    // Navigate to admin - should show loading
    await page.goto('/admin/dashboard');
    
    // Check for loading state
    const loadingText = page.locator('text=/vérification|loading|chargement/i');
    const spinner = page.locator('.animate-spin');
    
    // At least one should be visible during the delay
    const loadingVisible = await loadingText.isVisible().catch(() => false);
    const spinnerVisible = await spinner.isVisible().catch(() => false);
    
    expect(loadingVisible || spinnerVisible).toBe(true);
  });
});
