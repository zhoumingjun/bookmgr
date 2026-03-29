import apiClient from './client';

interface LoginResponse {
  token: string;
}

interface RegisterResponse {
  id: string;
  username: string;
  email: string;
  role: number;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { username, password });
  return data;
}

export async function register(username: string, email: string, password: string): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register', { username, email, password });
  return data;
}
