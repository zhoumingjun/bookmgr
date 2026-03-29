import { ApiClient } from './helpers/api-client';
import { TEST_USER } from './helpers/test-data';

/**
 * Global setup: ensure the test user exists in the test environment.
 * Runs once before all tests.
 */
async function globalSetup() {
  const client = new ApiClient();

  // Try to register test user; ignore if already exists
  try {
    await client.register(TEST_USER.username, TEST_USER.password);
    console.log(`Global setup: registered test user "${TEST_USER.username}"`);
  } catch {
    console.log(`Global setup: test user "${TEST_USER.username}" already exists`);
  }

  // Verify login works
  await client.login(TEST_USER.username, TEST_USER.password);
  console.log('Global setup: test user login verified');
}

export default globalSetup;
