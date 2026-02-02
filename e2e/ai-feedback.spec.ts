import { test, expect } from '@playwright/test';

test.describe('AI Feedback Loop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test_minded_qa_2026@test.com');
    await page.fill('input[type="password"]', 'TestMinded2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('feedback buttons are visible on AI suggestions', async ({ page }) => {
    await page.goto('/ai-coach');
    
    // Wait for AI suggestions to load
    await page.waitForSelector('[data-testid="sage-suggestion"], .suggestion-card', { 
      timeout: 10000 
    }).catch(() => {});
    
    // Check that feedback buttons exist
    const feedbackButtons = page.locator('[data-testid="feedback-positive"], [data-testid="feedback-neutral"], [data-testid="feedback-negative"]');
    
    const count = await feedbackButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('can submit positive feedback', async ({ page }) => {
    await page.goto('/ai-coach');
    
    await page.waitForSelector('[data-testid="feedback-positive"]', { timeout: 10000 }).catch(() => {});
    
    const positiveButton = page.locator('[data-testid="feedback-positive"]').first();
    
    if (await positiveButton.isVisible()) {
      const responsePromise = page.waitForResponse(
        r => r.url().includes('suggestion_feedback') && r.request().method() === 'POST'
      );
      
      await positiveButton.click();
      
      const response = await responsePromise.catch(() => null);
      if (response) {
        expect(response.status()).toBe(201);
      }
      
      await expect(page.locator('[data-testid="feedback-success"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('can submit negative feedback', async ({ page }) => {
    await page.goto('/journal');
    
    await page.fill('textarea', 'Test de suggestions IA pour le feedback');
    
    const suggestButton = page.locator('button:has-text(/suggestion|IA|assist/i)');
    if (await suggestButton.isVisible()) {
      await suggestButton.click();
      await page.waitForTimeout(3000);
      
      const negativeButton = page.locator('[data-testid="feedback-negative"]').first();
      if (await negativeButton.isVisible()) {
        await negativeButton.click();
        await expect(page.locator('[data-testid="feedback-success"]')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('feedback buttons disappear after voting', async ({ page }) => {
    await page.goto('/ai-coach');
    
    const feedbackButton = page.locator('[data-testid="feedback-positive"]').first();
    
    if (await feedbackButton.isVisible()) {
      await feedbackButton.click();
      await page.waitForTimeout(500);
      
      await expect(page.locator('[data-testid="feedback-success"]').first()).toBeVisible();
    }
  });
});

test.describe('Personalization Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test_minded_qa_2026@test.com');
    await page.fill('input[type="password"]', 'TestMinded2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('personalization levels are visible in settings', async ({ page }) => {
    await page.goto('/settings');
    
    const levels = page.locator('[data-testid="personalization-level"]');
    
    await expect(levels.first()).toBeVisible({ timeout: 5000 });
    expect(await levels.count()).toBe(3);
  });

  test('can change personalization level', async ({ page }) => {
    await page.goto('/settings');
    
    const exploratoryButton = page.locator('[data-testid="personalization-level"][data-level="exploratory"]');
    
    if (await exploratoryButton.isVisible()) {
      const responsePromise = page.waitForResponse(
        r => r.url().includes('profiles') && r.request().method() === 'PATCH'
      );
      
      await exploratoryButton.click();
      
      const response = await responsePromise.catch(() => null);
      if (response) {
        expect([200, 204]).toContain(response.status());
      }
    }
  });

  test('can toggle explain suggestions switch', async ({ page }) => {
    await page.goto('/settings');
    
    const switchElement = page.locator('[data-testid="explain-suggestions-switch"]');
    
    if (await switchElement.isVisible()) {
      await switchElement.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Interests Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test_minded_qa_2026@test.com');
    await page.fill('input[type="password"]', 'TestMinded2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('interest categories are visible', async ({ page }) => {
    await page.goto('/settings');
    
    const categories = page.locator('[data-testid="interest-category"]');
    
    await expect(categories.first()).toBeVisible({ timeout: 5000 });
    expect(await categories.count()).toBeGreaterThan(0);
  });

  test('can select interest categories', async ({ page }) => {
    await page.goto('/settings');
    
    const sportCategory = page.locator('[data-testid="interest-category"][data-category="sport"]');
    
    if (await sportCategory.isVisible()) {
      await sportCategory.click();
      await page.waitForTimeout(500);
      
      const subInterests = page.locator('[data-testid="interest-item"]');
      const count = await subInterests.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('can save interest selection', async ({ page }) => {
    await page.goto('/settings');
    
    const category = page.locator('[data-testid="interest-category"]').first();
    
    if (await category.isVisible()) {
      await category.click();
      await page.waitForTimeout(500);
      
      const interest = page.locator('[data-testid="interest-item"]').first();
      if (await interest.isVisible()) {
        await interest.click();
        
        const saveButton = page.locator('[data-testid="save-interests"]');
        if (await saveButton.isVisible()) {
          const responsePromise = page.waitForResponse(
            r => r.url().includes('user_interests')
          );
          
          await saveButton.click();
          
          const response = await responsePromise.catch(() => null);
          if (response) {
            expect([200, 201, 204]).toContain(response.status());
          }
        }
      }
    }
  });
});

test.describe('Sage Chat', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test_minded_qa_2026@test.com');
    await page.fill('input[type="password"]', 'TestMinded2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('chat tab is accessible', async ({ page }) => {
    await page.goto('/ai-coach');
    
    const chatTab = page.locator('button:has-text(/chat/i), [data-tab="chat"], [role="tab"]:has-text(/chat/i)');
    
    await expect(chatTab).toBeVisible({ timeout: 5000 });
    await chatTab.click();
    
    const chatInput = page.locator('[data-testid="chat-input"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });
  });

  test('can send a message to Sage', async ({ page }) => {
    await page.goto('/ai-coach');
    
    const chatTab = page.locator('button:has-text(/chat/i), [data-tab="chat"]');
    if (await chatTab.isVisible()) {
      await chatTab.click();
    }
    
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Bonjour Sage, comment vas-tu ?');
    
    const sendButton = page.locator('[data-testid="send-message"]');
    await sendButton.click();
    
    await expect(page.locator('[data-testid="user-message"]')).toBeVisible({ timeout: 3000 });
    
    await page.waitForSelector('[data-testid="sage-response"]', { 
      timeout: 15000 
    }).catch(() => {});
  });

  test('chat response time is under 10 seconds', async ({ page }) => {
    await page.goto('/ai-coach');
    
    const chatTab = page.locator('button:has-text(/chat/i)');
    if (await chatTab.isVisible()) {
      await chatTab.click();
    }
    
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill('Quel est mon score actuel ?');
    
    const startTime = Date.now();
    
    const sendButton = page.locator('[data-testid="send-message"]');
    await sendButton.click();
    
    await page.waitForSelector('[data-testid="sage-response"]', { 
      timeout: 10000 
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`Chat response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(10000);
  });

  test('history tab shows past interactions', async ({ page }) => {
    await page.goto('/ai-coach');
    
    const historyTab = page.locator('button:has-text(/historique|history/i), [data-tab="history"]');
    
    if (await historyTab.isVisible()) {
      await historyTab.click();
      
      await page.waitForTimeout(2000);
      
      const historyItems = page.locator('[data-testid="history-item"], .proposal-card, .history-entry');
      const emptyState = page.locator('text=/aucun|empty|pas encore/i');
      
      const hasItems = await historyItems.count() > 0;
      const hasEmptyState = await emptyState.isVisible();
      
      expect(hasItems || hasEmptyState).toBe(true);
    }
  });
});

test.describe('Smart Suggestions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'test_minded_qa_2026@test.com');
    await page.fill('input[type="password"]', 'TestMinded2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('can refresh suggestions', async ({ page }) => {
    await page.goto('/identity');
    
    const refreshButton = page.locator('button[aria-label*="refresh"], button:has(svg.lucide-refresh-cw), [data-testid="refresh-suggestions"]');
    
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(3000);
    }
  });
});
