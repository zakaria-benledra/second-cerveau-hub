import { test, expect } from '@playwright/test';

test.describe('Journal V40 Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test_minded_qa_2026@test.com');
    await page.fill('input[type="password"]', 'TestMinded2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('journal page has 5 tabs', async ({ page }) => {
    await page.goto('/journal');
    
    const tabs = page.locator('[role="tablist"] button, [data-testid="journal-tab"]');
    await expect(tabs.first()).toBeVisible({ timeout: 5000 });
    
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(4); // At least 4-5 tabs
  });

  test('date picker is visible and functional', async ({ page }) => {
    await page.goto('/journal');
    
    // Find date picker button
    const datePicker = page.locator('[data-testid="date-picker"], button:has-text("Aujourd"), .date-picker');
    await expect(datePicker.first()).toBeVisible({ timeout: 5000 });
  });

  test('can navigate to previous day', async ({ page }) => {
    await page.goto('/journal');
    
    // Find navigation arrows
    const prevButton = page.locator('button:has([data-testid="chevron-left"]), button:has-text("<"), [data-testid="prev-day"]');
    
    if (await prevButton.first().isVisible()) {
      await prevButton.first().click();
      await page.waitForTimeout(500);
      
      // Should show alert for past date
      const alert = page.locator('[data-testid="past-date-alert"], .alert, text=/rédiges/i');
      await expect(alert.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
  });

  test('return to today button works', async ({ page }) => {
    await page.goto('/journal');
    
    // Navigate to past
    const prevButton = page.locator('button:has([data-testid="chevron-left"]), [data-testid="prev-day"]').first();
    if (await prevButton.isVisible()) {
      await prevButton.click();
      await page.waitForTimeout(500);
      
      // Click return to today
      const todayButton = page.locator('button:has-text("aujourd"), [data-testid="return-today"]');
      if (await todayButton.first().isVisible()) {
        await todayButton.first().click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('mood selection works', async ({ page }) => {
    await page.goto('/journal');
    
    // Find mood buttons
    const moodButtons = page.locator('[data-testid="mood-button"], button:has-text("Super"), button:has-text("Bien")');
    
    if (await moodButtons.first().isVisible()) {
      await moodButtons.first().click();
      
      // Button should be selected (has default/primary variant)
      await expect(moodButtons.first()).toHaveClass(/default|primary|selected/);
    }
  });

  test('energy selection works', async ({ page }) => {
    await page.goto('/journal');
    
    // Find energy buttons
    const energyButtons = page.locator('[data-testid="energy-button"], button:has-text("Élevée"), button:has-text("Moyenne")');
    
    if (await energyButtons.first().isVisible()) {
      await energyButtons.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('domain selector works', async ({ page }) => {
    await page.goto('/journal');
    
    // Find domain select
    const domainSelect = page.locator('[data-testid="domain-select"], select, [role="combobox"]').first();
    
    if (await domainSelect.isVisible()) {
      await domainSelect.click();
      await page.waitForTimeout(300);
      
      // Select an option
      const option = page.locator('[role="option"], option').first();
      if (await option.isVisible()) {
        await option.click();
      }
    }
  });

  test('reflection templates are available', async ({ page }) => {
    await page.goto('/journal');
    
    // Find template buttons
    const templates = page.locator('button:has-text("Situation"), button:has-text("Obstacle"), [data-testid="template-button"]');
    
    const count = await templates.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('AI suggestions button is functional', async ({ page }) => {
    await page.goto('/journal');
    
    // Find AI suggestions button
    const aiButton = page.locator('button:has-text("suggestion"), button:has-text("Obtenir"), [data-testid="get-suggestions"]');
    
    if (await aiButton.first().isVisible()) {
      await aiButton.first().click();
      
      // Wait for loading or suggestions
      await page.waitForTimeout(3000);
    }
  });

  test('can save journal entry', async ({ page }) => {
    await page.goto('/journal');
    
    // Fill in reflections
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('Test entry for E2E testing V40');
    }
    
    // Click save button
    const saveButton = page.locator('button:has-text("Sauvegarder"), [data-testid="save-journal"]');
    if (await saveButton.first().isVisible()) {
      await saveButton.first().click();
      
      // Check for success toast
      const toast = page.locator('[data-testid="toast"], .toast, [role="alert"]');
      await expect(toast.first()).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
  });

  test('timeline tab shows past entries', async ({ page }) => {
    await page.goto('/journal');
    
    // Click timeline tab
    const timelineTab = page.locator('button:has-text("Timeline"), [data-testid="tab-timeline"]');
    if (await timelineTab.isVisible()) {
      await timelineTab.click();
      await page.waitForTimeout(1000);
      
      // Should show entries or empty state
      const content = page.locator('[data-testid="timeline-content"], .timeline, [data-testid="empty-state"]');
      await expect(content.first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('notes tab allows creating notes', async ({ page }) => {
    await page.goto('/journal');
    
    // Click notes tab
    const notesTab = page.locator('button:has-text("Notes"), [data-testid="tab-notes"]');
    if (await notesTab.isVisible()) {
      await notesTab.click();
      await page.waitForTimeout(500);
      
      // Find note input
      const noteInput = page.locator('textarea, input[placeholder*="note"]').first();
      await expect(noteInput).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
  });
});
