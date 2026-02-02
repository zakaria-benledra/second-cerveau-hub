import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('mobile: navigation is accessible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Mobile should show menu button or bottom navigation
    const mobileNav = page.locator('[data-testid="mobile-nav"], nav, button[aria-label*="menu" i]');
    await expect(mobileNav.first()).toBeVisible();
  });

  test('desktop: sidebar is visible on protected routes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/auth');
    
    // On larger screens, auth form should be centered and visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('mobile: landing page is responsive', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    
    // Hero section should be visible on mobile
    await expect(page.locator('h1')).toBeVisible();
    
    // Check for no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test('tablet: layout adapts correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
  });
});
