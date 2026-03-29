import apiClient from './client';

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  role: string;
  create_time: string;
  update_time: string;
}

interface ListUsersResponse {
  users: UserDTO[];
  next_page_token: string;
}

interface GetUserResponse {
  user: UserDTO;
}

interface UpdateUserResponse {
  user: UserDTO;
}

export async function listUsers(pageSize = 20, pageToken = ''): Promise<ListUsersResponse> {
  const params: Record<string, string | number> = { page_size: pageSize };
  if (pageToken) params.page_token = pageToken;
  const { data } = await apiClient.get<ListUsersResponse>('/users', { params });
  return data;
}

export async function getUser(id: string): Promise<GetUserResponse> {
  const { data } = await apiClient.get<GetUserResponse>(`/users/${id}`);
  return data;
}

export async function updateUser(
  id: string,
  fields: { username?: string; email?: string; role?: string; password?: string },
  updateMask: string[],
): Promise<UpdateUserResponse> {
  const roleMap: Record<string, number> = { ROLE_USER: 1, ROLE_ADMIN: 2 };
  const { data } = await apiClient.patch<UpdateUserResponse>(`/users/${id}`, {
    user: {
      id,
      ...fields,
      role: fields.role ? roleMap[fields.role] ?? 0 : undefined,
    },
    update_mask: updateMask.join(','),
    password: fields.password || '',
  });
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
