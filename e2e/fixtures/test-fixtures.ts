import { test as base } from 'playwright-bdd';
import { ApiClient } from '../helpers/api-client';
import { TEST_ADMIN, TEST_USER } from '../helpers/test-data';

type TestFixtures = {
  apiClient: ApiClient;
  adminPage: ReturnType<typeof base.extend>;
  authenticatedPage: ReturnType<typeof base.extend>;
};

export const test = base.extend<TestFixtures>({
  apiClient: async ({}, use) => {
    const client = new ApiClient();
    await use(client);
  },

  /** A page authenticated as admin via localStorage JWT injection */
  adminPage: async ({ page }, use) => {
    const client = new ApiClient();
    const token = await client.login(TEST_ADMIN.username, TEST_ADMIN.password);
    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.reload();
    await use(page);
  },

  /** A page authenticated as regular user via localStorage JWT injection */
  authenticatedPage: async ({ page }, use) => {
    const client = new ApiClient();
    const token = await client.login(TEST_USER.username, TEST_USER.password);
    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.reload();
    await use(page);
  },
});

export { expect } from '@playwright/test';
