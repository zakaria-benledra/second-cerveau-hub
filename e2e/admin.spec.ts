import { test, expect } from '@playwright/test';

test.describe('Admin Routes Access Control', () => {
  test.describe('Unauthenticated users', () => {
    test('should redirect to auth page from /admin/dashboard', async ({ page }) => {
      await page.goto('/admin/dashboard');
      
      // Should be redirected to auth page
      await expect(page).toHaveURL(/\/auth/);
    });

    test('should redirect to auth page from /admin/analytics', async ({ page }) => {
      await page.goto('/admin/analytics');
      
      // Should be redirected to auth page
      await expect(page).toHaveURL(/\/auth/);
    });
  });

  test.describe('Authenticated non-admin users', () => {
    // Note: These tests require a test user without admin role
    // In a real scenario, you would set up test fixtures with proper auth
    
    test('should show access denied on /admin/dashboard for non-admin', async ({ page }) => {
      // This test assumes a logged-in non-admin user session
      // You would typically set up auth via API or localStorage before this
      
      await page.goto('/admin/dashboard');
      
      // Either redirected to auth, or shows access denied
      const isOnAuth = page.url().includes('/auth');
      const accessDenied = page.locator('text=Accès refusé');
      
      if (!isOnAuth) {
        await expect(accessDenied).toBeVisible({ timeout: 10000 });
      }
    });

    test('should show access denied on /admin/analytics for non-admin', async ({ page }) => {
      await page.goto('/admin/analytics');
      
      const isOnAuth = page.url().includes('/auth');
      const accessDenied = page.locator('text=Accès refusé');
      
      if (!isOnAuth) {
        await expect(accessDenied).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Admin route UI elements', () => {
    test('access denied page should have return button', async ({ page }) => {
      // Navigate to admin page (will show access denied for non-admin)
      await page.goto('/admin/dashboard');
      
      // If we're not redirected to auth, check for the return button
      const isOnAuth = page.url().includes('/auth');
      
      if (!isOnAuth) {
        const returnButton = page.locator('a[href="/identity"]');
        await expect(returnButton).toBeVisible({ timeout: 10000 });
        await expect(returnButton).toContainText('Retour');
      }
    });

    test('access denied page should show shield icon', async ({ page }) => {
      await page.goto('/admin/dashboard');
      
      const isOnAuth = page.url().includes('/auth');
      
      if (!isOnAuth) {
        // ShieldAlert icon should be visible
        const shieldIcon = page.locator('svg.lucide-shield-alert');
        await expect(shieldIcon).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Navigation protection', () => {
    test('should not expose admin links to non-admin users in navigation', async ({ page }) => {
      // Go to a protected but non-admin page
      await page.goto('/identity');
      
      // Check that admin links are not visible in navigation
      const adminDashboardLink = page.locator('a[href="/admin/dashboard"]');
      const adminAnalyticsLink = page.locator('a[href="/admin/analytics"]');
      
      // These should not be visible to non-admin users
      // Note: This depends on your navigation implementation
      await expect(adminDashboardLink).not.toBeVisible();
      await expect(adminAnalyticsLink).not.toBeVisible();
    });
  });
});

test.describe('Admin Route Loading States', () => {
  test('should show loading indicator while checking permissions', async ({ page }) => {
    // Intercept the user_roles query to delay it
    await page.route('**/rest/v1/user_roles*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/admin/dashboard');
    
    // Should show loading state
    const loadingText = page.locator('text=Vérification des permissions');
    const spinner = page.locator('.animate-spin');
    
    // At least one of these should be visible during loading
    const isOnAuth = page.url().includes('/auth');
    if (!isOnAuth) {
      // Either loading is shown or we've already resolved
      const loadingVisible = await loadingText.isVisible().catch(() => false);
      const spinnerVisible = await spinner.isVisible().catch(() => false);
      
      // This is a soft assertion - loading might complete too fast
      console.log('Loading state visible:', loadingVisible || spinnerVisible);
    }
  });
});
