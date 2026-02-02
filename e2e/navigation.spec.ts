import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('landing page loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/minded/i);
    // Check hero section exists
    await expect(page.locator('h1')).toBeVisible();
  });

  test('404 page for unknown routes', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    await expect(page.locator('text=/404|not found|introuvable/i')).toBeVisible();
  });

  test('pricing page is accessible', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('text=/tarif|pricing|plan/i')).toBeVisible();
  });

  // Test for route redirects
  test('/progress route should redirect to /scores', async ({ page }) => {
    await page.goto('/progress');
    
    // URL should not stay on /progress (should redirect)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/progress');
  });
});
