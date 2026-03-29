const BASE_URL = process.env.BASE_URL || 'http://localhost:9000';

interface LoginResponse {
  token: string;
}

interface UserResponse {
  user: { id: string; username: string; role: string };
}

interface BookResponse {
  book: { id: string; title: string; author: string };
}

export class ApiClient {
  private token = '';

  async login(username: string, password: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    const data = (await res.json()) as LoginResponse;
    this.token = data.token;
    return this.token;
  }

  async register(username: string, password: string): Promise<UserResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(`Register failed: ${res.status}`);
    return (await res.json()) as UserResponse;
  }

  async createBook(title: string, author: string): Promise<BookResponse> {
    const res = await fetch(`${BASE_URL}/api/v1/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ title, author }),
    });
    if (!res.ok) throw new Error(`Create book failed: ${res.status}`);
    return (await res.json()) as BookResponse;
  }

  async request(method: string, path: string, body?: unknown): Promise<Response> {
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (body) headers['Content-Type'] = 'application/json';

    return fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  getToken(): string {
    return this.token;
  }
}
