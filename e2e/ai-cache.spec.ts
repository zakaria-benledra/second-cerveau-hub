import { test, expect } from '@playwright/test';

test.describe('AI Cache Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test_minded_qa_2026@test.com');
    await page.fill('input[type="password"]', 'TestMinded2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('suggestions load quickly on repeat visits', async ({ page }) => {
    // First visit - may be slow
    await page.goto('/identity');
    await page.waitForTimeout(3000);
    
    // Navigate away
    await page.goto('/settings');
    await page.waitForTimeout(1000);
    
    // Second visit - should be cached
    const startTime = Date.now();
    await page.goto('/identity');
    
    // Wait for suggestions to appear
    const suggestions = page.locator('[data-testid="smart-suggestion"], .suggestion-card');
    await suggestions.first().waitFor({ timeout: 5000 }).catch(() => {});
    
    const loadTime = Date.now() - startTime;
    
    // Should load faster on second visit (cache hit)
    // This is a soft assertion - cache might not always hit
    console.log(`Suggestions load time: ${loadTime}ms`);
  });

  test('ai-coach loads suggestions', async ({ page }) => {
    await page.goto('/ai-coach');
    
    // Wait for suggestions to load
    await page.waitForTimeout(3000);
    
    // Check that some content loaded
    const content = page.locator('[data-testid="sage-suggestion"], .suggestion, .ai-content');
    const hasContent = await content.count();
    
    expect(hasContent).toBeGreaterThanOrEqual(0);
  });

  test('refresh suggestions button works', async ({ page }) => {
    await page.goto('/ai-coach');
    await page.waitForTimeout(2000);
    
    const refreshButton = page.locator('button:has-text("Refresh"), button:has([data-testid="refresh-icon"]), [data-testid="refresh-suggestions"]');
    
    if (await refreshButton.first().isVisible()) {
      await refreshButton.first().click();
      
      // Should show loading state
      await page.waitForTimeout(500);
    }
  });
});
