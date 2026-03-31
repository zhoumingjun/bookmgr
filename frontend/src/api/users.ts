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

interface CreateUserResponse {
  user: UserDTO;
  generated_password: string;
}

// Role enum values (matching proto definitions)
export const RoleOptions = [
  { label: '超级管理员', value: 'ROLE_SUPER_ADMIN' },
  { label: '普通管理员', value: 'ROLE_ADMIN' },
  { label: '教师用户', value: 'ROLE_TEACHER' },
  { label: '家长用户', value: 'ROLE_PARENT' },
];

// Map role string to proto number value
const roleToNumber: Record<string, number> = {
  ROLE_SUPER_ADMIN: 1,
  ROLE_ADMIN: 2,
  ROLE_TEACHER: 3,
  ROLE_PARENT: 4,
};

const roleLabelMap: Record<string, string> = {
  ROLE_SUPER_ADMIN: '超级管理员',
  ROLE_ADMIN: '普通管理员',
  ROLE_TEACHER: '教师用户',
  ROLE_PARENT: '家长用户',
};

export function getRoleLabel(role: string): string {
  return roleLabelMap[role] || role;
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'ROLE_SUPER_ADMIN': return 'red';
    case 'ROLE_ADMIN': return 'orange';
    case 'ROLE_TEACHER': return 'blue';
    case 'ROLE_PARENT': return 'green';
    default: return 'default';
  }
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

export async function createUser(params: {
  username: string;
  email: string;
  role: string;
  password?: string;
}): Promise<CreateUserResponse> {
  const { data } = await apiClient.post<CreateUserResponse>('/users', {
    username: params.username,
    email: params.email,
    role: roleToNumber[params.role] ?? 3,
    password: params.password || '',
  });
  return data;
}

export async function updateUser(
  id: string,
  fields: { username?: string; email?: string; role?: string; password?: string },
  updateMask: string[],
): Promise<UpdateUserResponse> {
  const { data } = await apiClient.patch<UpdateUserResponse>(`/users/${id}`, {
    user: {
      id,
      ...fields,
      role: fields.role ? roleToNumber[fields.role] ?? 0 : undefined,
    },
    update_mask: updateMask.join(','),
    password: fields.password || '',
  });
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`);
}
