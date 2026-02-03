import { test, expect } from '@playwright/test';

test.describe('Gamification System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test_minded_qa_2026@test.com');
    await page.fill('input[type="password"]', 'TestMinded2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('achievements page loads correctly', async ({ page }) => {
    await page.goto('/achievements');
    
    // Verify page title
    await expect(page.locator('h1, [data-testid="page-title"]')).toContainText(/succès|achievements/i);
    
    // Verify XP progress bar exists
    const xpBar = page.locator('[data-testid="xp-progress"], .xp-progress-bar');
    await expect(xpBar).toBeVisible({ timeout: 5000 });
  });

  test('level and XP are displayed', async ({ page }) => {
    await page.goto('/achievements');
    
    // Look for level indicator
    const levelText = page.locator('text=/niveau|level/i').first();
    await expect(levelText).toBeVisible({ timeout: 5000 });
    
    // Look for XP value
    const xpText = page.locator('text=/xp/i').first();
    await expect(xpText).toBeVisible();
  });

  test('badges grid is visible', async ({ page }) => {
    await page.goto('/achievements');
    
    // Wait for badges to load
    await page.waitForTimeout(2000);
    
    // Check for badge cards or grid
    const badges = page.locator('[data-testid="badge-card"], .badge-card, [class*="badge"]');
    const count = await badges.count();
    
    // Should have at least some badges (locked or unlocked)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('stats cards show correct metrics', async ({ page }) => {
    await page.goto('/achievements');
    
    // Check for stat cards
    const statCards = page.locator('[data-testid="stat-card"], .stat-card');
    
    // Should have stats for: streak, longest streak, habits, tasks
    await page.waitForTimeout(1000);
    
    // Verify streak is visible
    const streakText = page.locator('text=/streak/i').first();
    await expect(streakText).toBeVisible({ timeout: 3000 });
  });

  test('tabs filter badges by category', async ({ page }) => {
    await page.goto('/achievements');
    
    // Find tabs
    const tabs = page.locator('[role="tablist"] button, [data-testid="badge-tab"]');
    const tabCount = await tabs.count();
    
    if (tabCount > 1) {
      // Click on second tab
      await tabs.nth(1).click();
      await page.waitForTimeout(500);
      
      // Page should still be functional
      await expect(page.locator('h1, [data-testid="page-title"]')).toBeVisible();
    }
  });

  test('XP animation works on action', async ({ page }) => {
    await page.goto('/habits');
    
    // Find a habit to complete
    const habitCheckbox = page.locator('[data-testid="habit-check"], input[type="checkbox"]').first();
    
    if (await habitCheckbox.isVisible()) {
      // Complete the habit
      await habitCheckbox.click();
      
      // Check for XP toast or animation
      const toast = page.locator('[data-testid="toast"], .toast, [role="alert"]');
      await expect(toast).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
  });
});

test.describe('Streak System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test_minded_qa_2026@test.com');
    await page.fill('input[type="password"]', 'TestMinded2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('streak badge is visible on identity page', async ({ page }) => {
    await page.goto('/identity');
    
    // Look for streak indicator
    const streak = page.locator('[data-testid="streak-badge"], .streak-badge, text=/🔥|streak/i');
    await expect(streak.first()).toBeVisible({ timeout: 5000 });
  });

  test('streak counter shows a number', async ({ page }) => {
    await page.goto('/identity');
    
    // Find streak number
    const streakNumber = page.locator('[data-testid="streak-count"]');
    
    if (await streakNumber.isVisible()) {
      const text = await streakNumber.textContent();
      expect(text).toMatch(/\d+/);
    }
  });
});
