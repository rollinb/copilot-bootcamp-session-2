const { test, expect } = require('@playwright/test');

test('create, complete, and delete a task', async ({ page }) => {
  // Assumes frontend dev server is running at baseURL (default http://localhost:3000)
  await page.goto('/');

  // Add a task
  const desc = 'E2E test task ' + Date.now();
  await page.fill('input[placeholder="Task description"]', desc);
  await page.click('button:has-text("Add Task")');

  const taskItem = page.locator('li', { hasText: desc });
  await expect(taskItem).toBeVisible();

  // Toggle complete
  const checkbox = taskItem.locator('input[type="checkbox"]');
  await checkbox.check();
  await expect(taskItem).toHaveClass(/completed/);

  // Delete the task
  const deleteBtn = taskItem.locator('button', { hasText: 'Delete' });
  await deleteBtn.click();
  await expect(taskItem).toHaveCount(0);
});
