import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { When, Then } = createBdd();

// --- When ---

When('我访问用户管理页面', async ({ page }) => {
  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');
});

When('我点击用户 {string} 的编辑按钮', async ({ page }, username: string) => {
  const row = page.locator('tr', { hasText: username });
  await row.getByRole('button', { name: /编辑|Edit/i }).click();
});

When('我点击用户 {string} 的删除按钮', async ({ page }, username: string) => {
  const row = page.locator('tr', { hasText: username });
  await row.getByRole('button', { name: /删除|Delete/i }).click();
});

When('我修改角色为 {string}', async ({ page }, role: string) => {
  await page.locator('#role').click();
  await page.getByText(role, { exact: false }).click();
});

When('我输入新密码 {string}', async ({ page }, password: string) => {
  await page.locator('#password').fill(password);
});

// --- Then ---

Then('我应该看到用户列表表格', async ({ page }) => {
  await expect(page.locator('.ant-table')).toBeVisible();
});

Then('表格应该包含 {string} 用户', async ({ page }, username: string) => {
  await expect(page.locator('.ant-table')).toContainText(username);
});

Then('我应该看到管理员角色标签', async ({ page }) => {
  await expect(page.locator('.ant-tag').filter({ hasText: /管理员|Admin/ })).toBeVisible();
});

Then('我应该看到用户更新成功的提示', async ({ page }) => {
  await expect(page.locator('.ant-message')).toContainText(/用户已更新|User updated/i);
});

Then('我应该看到用户删除成功的提示', async ({ page }) => {
  await expect(page.locator('.ant-message')).toContainText(/用户已删除|User deleted/i);
});

Then('我应该看到删除确认弹窗', async ({ page }) => {
  await expect(page.locator('.ant-popconfirm')).toBeVisible();
});
