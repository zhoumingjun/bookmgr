import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { ApiClient } from '../helpers/api-client';
import { TEST_ADMIN } from '../helpers/test-data';

const { Given, When, Then } = createBdd();

// Store created book IDs for the scenario
let lastCreatedBookId = '';

// --- Given ---

Given('管理员已创建图书 {string} 作者 {string}', async ({}, title: string, author: string) => {
  const client = new ApiClient();
  await client.login(TEST_ADMIN.username, TEST_ADMIN.password);
  const res = await client.createBook(title, author);
  lastCreatedBookId = res.book.id;
});

Given('管理员已创建图书 {string} 作者 {string} 并上传PDF', async ({}, title: string, author: string) => {
  const client = new ApiClient();
  await client.login(TEST_ADMIN.username, TEST_ADMIN.password);
  const res = await client.createBook(title, author);
  lastCreatedBookId = res.book.id;
  // Upload a dummy PDF via API
  const pdfContent = new Blob(['%PDF-1.4 dummy'], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', pdfContent, 'test.pdf');
  await fetch(`${process.env.BASE_URL || 'http://localhost:9000'}/api/v1/books/${lastCreatedBookId}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${client.getToken()}` },
    body: formData,
  });
});

Given('我已登录为管理员', async ({ page }) => {
  const client = new ApiClient();
  const token = await client.login(TEST_ADMIN.username, TEST_ADMIN.password);
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  await page.reload();
  await page.waitForURL('**/console/**');
});

Given('我已登录为普通用户', async ({ page }) => {
  const client = new ApiClient();
  // Ensure testuser exists
  try {
    await client.register('testuser', 'testpass123');
  } catch { /* already exists */ }
  const token = await client.login('testuser', 'testpass123');
  await page.goto('/');
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  await page.reload();
  await page.waitForURL('**/console/**');
});

// --- When ---

When('我访问图书浏览页面', async ({ page }) => {
  await page.goto('/console/books');
  await page.waitForLoadState('networkidle');
});

When('我访问该图书的详情页面', async ({ page }) => {
  await page.goto(`/console/books/${lastCreatedBookId}`);
  await page.waitForLoadState('networkidle');
});

When('我访问图书管理页面', async ({ page }) => {
  await page.goto('/admin/books');
  await page.waitForLoadState('networkidle');
});

When('我点击图书 {string}', async ({ page }, title: string) => {
  await page.getByText(title).click();
});

When('我点击添加图书按钮', async ({ page }) => {
  await page.getByRole('button', { name: /添加图书|Add Book/i }).click();
});

When('我输入书名 {string}', async ({ page }, title: string) => {
  await page.locator('#title').fill(title);
});

When('我输入作者名 {string}', async ({ page }, author: string) => {
  await page.locator('#author').fill(author);
});

When('我点击创建按钮', async ({ page }) => {
  await page.getByRole('button', { name: /创建|Create/i }).click();
});

When('我点击保存按钮', async ({ page }) => {
  await page.getByRole('button', { name: /保存|Save/i }).click();
});

When('我点击图书 {string} 的编辑按钮', async ({ page }, title: string) => {
  const row = page.locator('tr', { hasText: title });
  await row.getByRole('button', { name: /编辑|Edit/i }).click();
});

When('我点击图书 {string} 的删除按钮', async ({ page }, title: string) => {
  const row = page.locator('tr', { hasText: title });
  await row.getByRole('button', { name: /删除|Delete/i }).click();
});

When('我修改书名为 {string}', async ({ page }, newTitle: string) => {
  await page.locator('#title').fill(newTitle);
});

When('我确认删除', async ({ page }) => {
  await page.getByRole('button', { name: /确定|OK|Yes/i }).click();
});

// --- Then ---

Then('我应该看到页面标题 {string}', async ({ page }, title: string) => {
  await expect(page.getByText(title)).toBeVisible();
});

Then('我应该看到包含 {string} 的图书卡片', async ({ page }, title: string) => {
  await expect(page.getByText(title)).toBeVisible();
});

Then('图书卡片应该显示作者 {string}', async ({ page }, author: string) => {
  await expect(page.getByText(author)).toBeVisible();
});

Then('我应该进入图书详情页面', async ({ page }) => {
  await page.waitForURL('**/console/books/**');
});

Then('我应该看到图书标题 {string}', async ({ page }, title: string) => {
  await expect(page.getByText(title)).toBeVisible();
});

Then('我应该看到图书作者 {string}', async ({ page }, author: string) => {
  await expect(page.getByText(author)).toBeVisible();
});

Then('我应该看到添加时间', async ({ page }) => {
  await expect(page.getByText(/添加时间|Added/)).toBeVisible();
});

Then('我应该看到返回目录按钮', async ({ page }) => {
  await expect(page.getByText(/返回目录|Back to catalog/i)).toBeVisible();
});

Then('我应该看到下载PDF按钮', async ({ page }) => {
  await expect(page.getByText(/下载 PDF|Download PDF/i)).toBeVisible();
});

Then('我应该看到在线阅读按钮', async ({ page }) => {
  await expect(page.getByText(/在线阅读|Read Online/i)).toBeVisible();
});

Then('我应该看到创建成功的提示', async ({ page }) => {
  await expect(page.locator('.ant-message')).toContainText(/图书已创建|Book created/i);
});

Then('我应该返回图书管理页面', async ({ page }) => {
  await page.waitForURL('**/admin/books');
});

Then('我应该看到更新成功的提示', async ({ page }) => {
  await expect(page.locator('.ant-message')).toContainText(/图书已更新|Book updated/i);
});

Then('我应该看到删除成功的提示', async ({ page }) => {
  await expect(page.locator('.ant-message')).toContainText(/图书已删除|Book deleted/i);
});
