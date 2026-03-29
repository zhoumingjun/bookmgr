import { defineConfig } from '@playwright/test';
import { defineBddConfig, cucumberReporter } from 'playwright-bdd';

import path from 'path';

const testDir = defineBddConfig({
  featuresRoot: path.resolve(__dirname, '../features'),
  features: '../features/**/*.feature',
  steps: './steps/**/*.ts',
  language: 'zh-CN',
  tags: 'not @api-only',
});

export default defineConfig({
  testDir,
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:9000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chrome',
      use: {
        channel: 'chrome',
      },
    },
  ],
  reporter: [
    ['html', { open: 'never' }],
    cucumberReporter('html', { outputFile: 'cucumber-report/index.html' }),
  ],
  globalSetup: './global-setup.ts',
});
