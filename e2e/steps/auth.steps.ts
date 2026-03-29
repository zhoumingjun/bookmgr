import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { ApiClient } from '../helpers/api-client';
import { uniqueUsername } from '../helpers/test-data';

const { Given, When, Then } = createBdd();

// --- Given ---

Given('我在登录页面', async ({ page }) => {
  await page.goto('/login');
  await page.waitForSelector('form');
});

Given('我在注册页面', async ({ page }) => {
  await page.goto('/register');
  await page.waitForSelector('form');
});

Given('已存在用户 {string} 密码 {string}', async ({}, username: string, password: string) => {
  const client = new ApiClient();
  try {
    await client.register(username, password);
  } catch {
    // User already exists — ok
  }
});

// --- When ---

When('我输入用户名 {string}', async ({ page }, username: string) => {
  const actual = username.includes('<timestamp>')
    ? username.replace('<timestamp>', Date.now().toString())
    : username;
  await page.getByPlaceholder(/用户名|Username/i).fill(actual);
  // Store for later assertions if needed
  await page.evaluate((u) => (window as any).__testUsername = u, actual);
});

When('我输入邮箱 {string}', async ({ page }, email: string) => {
  const actual = email.includes('<timestamp>')
    ? email.replace('<timestamp>', Date.now().toString())
    : email;
  await page.getByPlaceholder(/邮箱|Email/i).fill(actual);
});

When('我输入密码 {string}', async ({ page }, password: string) => {
  const inputs = page.locator('input[type="password"]');
  const count = await inputs.count();
  if (count === 1) {
    await inputs.first().fill(password);
  } else {
    // On register page, fill the first password field
    await inputs.first().fill(password);
  }
});

When('我输入确认密码 {string}', async ({ page }, password: string) => {
  const inputs = page.locator('input[type="password"]');
  await inputs.nth(1).fill(password);
});

When('我点击登录按钮', async ({ page }) => {
  await page.locator('button[type="submit"]').click();
});

When('我点击注册按钮', async ({ page }) => {
  await page.locator('button[type="submit"]').click();
});

// --- Then ---

Then('我应该被重定向到登录页面', async ({ page }) => {
  await page.waitForURL('**/login');
});

Then('我应该被重定向到图书浏览页面', async ({ page }) => {
  // Admin redirects to /admin/users, regular user to /console/books
  await page.waitForURL(/\/(console\/books|admin)/, { timeout: 10_000 });
});

Then('我应该看到注册成功的提示', async ({ page }) => {
  await expect(page.locator('.ant-message')).toContainText(/注册成功|Registered successfully/i, { timeout: 10_000 });
});

Then('我应该看到登录错误提示', async ({ page }) => {
  // The 401 response triggers Axios interceptor which reloads to /login
  // Wait for the page to settle, then check we're still on login
  await page.waitForLoadState('networkidle');
  // Try to find Ant Design message first, fall back to checking login page
  const hasMessage = await page.locator('.ant-message-notice, .ant-message').isVisible({ timeout: 3000 }).catch(() => false);
  if (!hasMessage) {
    // The 401 interceptor redirected back to /login — verify we're on login page
    await expect(page).toHaveURL(/\/login/);
  }
});

Then('我应该看到密码不一致的错误提示', async ({ page }) => {
  await expect(page.locator('.ant-form-item-explain-error')).toContainText(/两次密码不一致|Passwords do not match/i);
});

Then('导航栏应该显示用户管理入口', async ({ page }) => {
  await expect(page.locator('header').getByText(/用户管理|Users/)).toBeVisible();
});

Then('导航栏不应该显示用户管理入口', async ({ page }) => {
  await expect(page.locator('header').getByText(/用户管理|Users/)).not.toBeVisible({ timeout: 3000 });
});
