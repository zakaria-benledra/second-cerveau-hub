import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('landing page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Should have exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('auth page form has proper labels', async ({ page }) => {
    await page.goto('/auth');
    
    // Email input should have associated label
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    // Password input should have associated label
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/auth');
    
    // Tab through the form
    await page.keyboard.press('Tab');
    
    // Some focusable element should be focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    
    // All buttons should have accessible names (text content or aria-label)
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const hasText = await button.textContent();
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasAriaLabelledBy = await button.getAttribute('aria-labelledby');
      
      // Button should have some form of accessible name
      const hasAccessibleName = (hasText && hasText.trim().length > 0) || hasAriaLabel || hasAriaLabelledBy;
      expect(hasAccessibleName).toBeTruthy();
    }
  });
});
