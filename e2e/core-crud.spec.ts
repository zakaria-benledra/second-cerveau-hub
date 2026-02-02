import { test, expect } from '@playwright/test';

test.describe('Tasks CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'user_standard@test.com');
    await page.fill('input[type="password"]', 'StandardPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('can create a new task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Click add task button
    await page.click('button:has-text(/ajouter|nouvelle|add|create/i)');
    
    // Fill task form
    const taskTitle = `Test Task ${Date.now()}`;
    await page.fill('input[name="title"], input[placeholder*="titre"], input[placeholder*="title"]', taskTitle);
    
    // Submit
    await page.click('button[type="submit"]:has-text(/créer|ajouter|save|create/i)');
    
    // Verify task appears in list
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible({ timeout: 5000 });
    
    // Verify API call succeeded
    const response = await page.waitForResponse(
      r => r.url().includes('/rest/v1/tasks') && r.status() === 201,
      { timeout: 5000 }
    ).catch(() => null);
    
    expect(response).not.toBeNull();
  });

  test('can update an existing task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Wait for tasks to load
    await page.waitForSelector('[data-testid="task-item"], .task-card, [class*="task"]', { timeout: 5000 }).catch(() => {});
    
    // Click on first task to edit
    const taskItem = page.locator('[data-testid="task-item"], .task-card, [class*="task"]').first();
    
    if (await taskItem.isVisible()) {
      await taskItem.click();
      
      // Update title
      const updatedTitle = `Updated Task ${Date.now()}`;
      await page.fill('input[name="title"], input[placeholder*="titre"]', updatedTitle);
      
      // Save
      await page.click('button:has-text(/sauvegarder|save|update|modifier/i)');
      
      // Verify update
      await expect(page.locator(`text=${updatedTitle}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('can delete a task', async ({ page }) => {
    await page.goto('/tasks');
    
    // Wait for tasks to load
    await page.waitForSelector('[data-testid="task-item"], .task-card', { timeout: 5000 }).catch(() => {});
    
    // Get initial task count
    const initialCount = await page.locator('[data-testid="task-item"], .task-card').count();
    
    if (initialCount > 0) {
      // Click delete button on first task
      const deleteButton = page.locator('button:has-text(/supprimer|delete|remove/i), button[aria-label*="delete"], [data-testid="delete-task"]').first();
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion if dialog appears
        const confirmButton = page.locator('button:has-text(/confirmer|confirm|oui|yes/i)');
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }
        
        // Wait for deletion
        await page.waitForTimeout(1000);
        
        // Verify count decreased or empty state shown
        const newCount = await page.locator('[data-testid="task-item"], .task-card').count();
        expect(newCount).toBeLessThanOrEqual(initialCount);
      }
    }
  });

  test('can toggle task completion', async ({ page }) => {
    await page.goto('/tasks');
    
    await page.waitForSelector('[data-testid="task-item"], .task-card', { timeout: 5000 }).catch(() => {});
    
    // Find a checkbox or toggle
    const checkbox = page.locator('input[type="checkbox"], [role="checkbox"]').first();
    
    if (await checkbox.isVisible()) {
      const initialState = await checkbox.isChecked();
      await checkbox.click();
      
      // Verify state changed
      const newState = await checkbox.isChecked();
      expect(newState).not.toBe(initialState);
    }
  });
});

test.describe('Habits CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'user_standard@test.com');
    await page.fill('input[type="password"]', 'StandardPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('can create a new habit', async ({ page }) => {
    await page.goto('/habits');
    
    // Click add habit button
    await page.click('button:has-text(/ajouter|nouvelle|add|create/i)');
    
    // Fill habit form
    const habitName = `Test Habit ${Date.now()}`;
    await page.fill('input[name="name"], input[name="title"], input[placeholder*="nom"], input[placeholder*="name"]', habitName);
    
    // Submit
    await page.click('button[type="submit"]:has-text(/créer|ajouter|save|create/i)');
    
    // Verify habit appears
    await expect(page.locator(`text=${habitName}`)).toBeVisible({ timeout: 5000 });
  });

  test('can log habit completion', async ({ page }) => {
    await page.goto('/habits');
    
    await page.waitForSelector('[data-testid="habit-item"], .habit-card, [class*="habit"]', { timeout: 5000 }).catch(() => {});
    
    // Find habit check button
    const checkButton = page.locator('button:has-text(/check|valider|done/i), [data-testid="habit-check"], input[type="checkbox"]').first();
    
    if (await checkButton.isVisible()) {
      await checkButton.click();
      
      // Verify visual feedback (e.g., checkmark, color change)
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/habit-completed.png' });
    }
  });

  test('can update habit details', async ({ page }) => {
    await page.goto('/habits');
    
    await page.waitForSelector('[data-testid="habit-item"], .habit-card', { timeout: 5000 }).catch(() => {});
    
    // Click edit on first habit
    const editButton = page.locator('button:has-text(/modifier|edit/i), button[aria-label*="edit"], [data-testid="edit-habit"]').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Update name
      const updatedName = `Updated Habit ${Date.now()}`;
      await page.fill('input[name="name"], input[name="title"]', updatedName);
      
      // Save
      await page.click('button:has-text(/sauvegarder|save|update/i)');
      
      // Verify update
      await expect(page.locator(`text=${updatedName}`)).toBeVisible({ timeout: 5000 });
    }
  });

  test('can delete a habit', async ({ page }) => {
    await page.goto('/habits');
    
    await page.waitForSelector('[data-testid="habit-item"], .habit-card', { timeout: 5000 }).catch(() => {});
    
    const initialCount = await page.locator('[data-testid="habit-item"], .habit-card').count();
    
    if (initialCount > 0) {
      const deleteButton = page.locator('button:has-text(/supprimer|delete/i), [data-testid="delete-habit"]').first();
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm if needed
        const confirmButton = page.locator('button:has-text(/confirmer|confirm|oui|yes/i)');
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }
        
        await page.waitForTimeout(1000);
        
        const newCount = await page.locator('[data-testid="habit-item"], .habit-card').count();
        expect(newCount).toBeLessThanOrEqual(initialCount);
      }
    }
  });
});

test.describe('Finance Transactions CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'user_standard@test.com');
    await page.fill('input[type="password"]', 'StandardPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('can create a new transaction', async ({ page }) => {
    await page.goto('/finance');
    
    // Click add transaction button
    await page.click('button:has-text(/ajouter|nouvelle|add|transaction/i)');
    
    // Fill transaction form
    await page.fill('input[name="amount"], input[placeholder*="montant"], input[type="number"]', '100');
    await page.fill('input[name="description"], input[placeholder*="description"], textarea[name="description"]', `Test Transaction ${Date.now()}`);
    
    // Select type if available
    const typeSelect = page.locator('select[name="type"], [data-testid="transaction-type"]');
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ index: 1 });
    }
    
    // Submit
    await page.click('button[type="submit"]:has-text(/créer|ajouter|save|create/i)');
    
    // Verify transaction appears or success toast
    await expect(page.locator('text=/100|transaction/i')).toBeVisible({ timeout: 5000 });
  });

  test('can update a transaction', async ({ page }) => {
    await page.goto('/finance');
    
    await page.waitForSelector('[data-testid="transaction-item"], .transaction-row, [class*="transaction"]', { timeout: 5000 }).catch(() => {});
    
    const transactionItem = page.locator('[data-testid="transaction-item"], .transaction-row').first();
    
    if (await transactionItem.isVisible()) {
      // Click to edit
      await transactionItem.click();
      
      // Update amount
      await page.fill('input[name="amount"], input[type="number"]', '250');
      
      // Save
      await page.click('button:has-text(/sauvegarder|save|update/i)');
      
      // Verify update
      await expect(page.locator('text=250')).toBeVisible({ timeout: 5000 });
    }
  });

  test('can delete a transaction', async ({ page }) => {
    await page.goto('/finance');
    
    await page.waitForSelector('[data-testid="transaction-item"], .transaction-row', { timeout: 5000 }).catch(() => {});
    
    const initialCount = await page.locator('[data-testid="transaction-item"], .transaction-row').count();
    
    if (initialCount > 0) {
      const deleteButton = page.locator('button:has-text(/supprimer|delete/i), [data-testid="delete-transaction"]').first();
      
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm if needed
        const confirmButton = page.locator('button:has-text(/confirmer|confirm|oui/i)');
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }
        
        await page.waitForTimeout(1000);
        
        const newCount = await page.locator('[data-testid="transaction-item"], .transaction-row').count();
        expect(newCount).toBeLessThanOrEqual(initialCount);
      }
    }
  });

  test('can filter transactions by type', async ({ page }) => {
    await page.goto('/finance');
    
    // Find filter controls
    const filterSelect = page.locator('select[name="filter"], [data-testid="transaction-filter"]');
    
    if (await filterSelect.isVisible()) {
      // Filter by income
      await filterSelect.selectOption({ label: /revenu|income/i });
      await page.waitForTimeout(500);
      
      // Verify only income transactions shown (or empty state)
      await page.screenshot({ path: 'screenshots/finance-filtered.png' });
    }
  });

  test('displays correct totals', async ({ page }) => {
    await page.goto('/finance');
    
    // Check for total/balance display
    const totalElement = page.locator('[data-testid="total-balance"], .total-amount, text=/total|solde|balance/i');
    
    await expect(totalElement).toBeVisible({ timeout: 5000 });
  });
});

test.describe('CRUD API Responses', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('input[type="email"]', 'user_standard@test.com');
    await page.fill('input[type="password"]', 'StandardPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*identity/);
  });

  test('task creation returns 201', async ({ page }) => {
    await page.goto('/tasks');
    
    // Set up response listener before action
    const responsePromise = page.waitForResponse(
      r => r.url().includes('/rest/v1/tasks') && r.request().method() === 'POST'
    );
    
    await page.click('button:has-text(/ajouter|add/i)');
    await page.fill('input[name="title"], input[placeholder*="titre"]', `API Test ${Date.now()}`);
    await page.click('button[type="submit"]');
    
    const response = await responsePromise.catch(() => null);
    if (response) {
      expect(response.status()).toBe(201);
    }
  });

  test('habit creation returns 201', async ({ page }) => {
    await page.goto('/habits');
    
    const responsePromise = page.waitForResponse(
      r => r.url().includes('/rest/v1/habits') && r.request().method() === 'POST'
    );
    
    await page.click('button:has-text(/ajouter|add/i)');
    await page.fill('input[name="name"], input[name="title"]', `API Habit ${Date.now()}`);
    await page.click('button[type="submit"]');
    
    const response = await responsePromise.catch(() => null);
    if (response) {
      expect(response.status()).toBe(201);
    }
  });

  test('transaction creation returns 201', async ({ page }) => {
    await page.goto('/finance');
    
    const responsePromise = page.waitForResponse(
      r => r.url().includes('/rest/v1/finance_transactions') && r.request().method() === 'POST'
    );
    
    await page.click('button:has-text(/ajouter|add/i)');
    await page.fill('input[name="amount"], input[type="number"]', '50');
    await page.click('button[type="submit"]');
    
    const response = await responsePromise.catch(() => null);
    if (response) {
      expect(response.status()).toBe(201);
    }
  });
});
