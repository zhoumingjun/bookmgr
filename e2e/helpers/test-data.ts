export const TEST_ADMIN = {
  username: 'admin',
  password: 'changeme',
};

export const TEST_USER = {
  username: 'testuser',
  password: 'testpass123',
};

/** Generate a unique username for scenario isolation */
export function uniqueUsername(prefix = 'user'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Generate a unique book title for scenario isolation */
export function uniqueBookTitle(prefix = 'Book'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
