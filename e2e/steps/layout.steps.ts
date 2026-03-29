import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, When, Then } = createBdd();

// --- When ---

When('我点击用户下拉菜单', async ({ page }) => {
  // The user dropdown button shows username with a down arrow in the header
  await page.locator('header').getByRole('button', { name: /down/ }).click();
});

When('我点击语言切换按钮', async ({ page }) => {
  // The language button shows "中文" or "EN" in the header
  await page.locator('header').getByRole('button', { name: /中文|EN/ }).click();
});

When('我刷新页面', async ({ page }) => {
  await page.reload();
  await page.waitForLoadState('networkidle');
});

Given('我已切换到英文界面', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('lang', 'en'));
  await page.reload();
  await page.waitForLoadState('networkidle');
});

// --- Then ---

Then('导航栏应该显示 {string}', async ({ page }, text: string) => {
  await expect(page.locator('header').getByText(text)).toBeVisible();
});

Then('导航栏不应该显示 {string}', async ({ page }, text: string) => {
  await expect(page.locator('header').getByText(text)).not.toBeVisible();
});

Then('我应该看到角色信息', async ({ page }) => {
  await expect(page.getByText(/管理员|Admin/)).toBeVisible();
});

Then('我应该看到退出登录选项', async ({ page }) => {
  await expect(page.getByText(/退出登录|Logout/)).toBeVisible();
});

Then('页面应该显示中文界面', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '图书目录' })).toBeVisible();
});

Then('页面应该显示英文界面', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Book Catalog' })).toBeVisible();
});

Then('语言偏好应该保存到 localStorage', async ({ page }) => {
  const lang = await page.evaluate(() => localStorage.getItem('lang'));
  expect(lang).toBe('en');
});
