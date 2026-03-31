import apiClient from './client';
import type { DimensionDTO } from './dimension';

export interface BookDTO {
  id: string;
  title: string;
  author: string;
  description: string;
  page_count: number;
  duration_minutes: number;
  core_goal: string;
  cognitive_level: string;
  resource_type: string;
  has_print: boolean;
  has_digital: boolean;
  has_audio: boolean;
  has_video: boolean;
  teaching_suggestion: string;
  parent_reading_guide: string;
  recommended_age_min: number;
  recommended_age_max: number;
  cover_image_url: string;
  cover_url: string;
  status: string;
  uploader_id: string;
  view_count: number;
  dimensions: DimensionDTO[];
  create_time: string;
  update_time: string;
}

interface ListBooksResponse {
  books: BookDTO[];
  next_page_token: string;
}

interface GetBookResponse {
  book: BookDTO;
}

interface CreateBookResponse {
  book: BookDTO;
}

interface UpdateBookResponse {
  book: BookDTO;
}

export interface CreateBookParams {
  title: string;
  author: string;
  description?: string;
  page_count?: number;
  duration_minutes?: number;
  core_goal: string;
  cognitive_level?: string;
  resource_type?: string;
  has_print?: boolean;
  has_digital?: boolean;
  has_audio?: boolean;
  has_video?: boolean;
  teaching_suggestion?: string;
  parent_reading_guide?: string;
  recommended_age_min?: number;
  recommended_age_max?: number;
  dimension_slugs: string[];
}

export async function listBooks(
  pageSize = 20,
  pageToken = '',
  dimensionSlug?: string,
  status?: string,
): Promise<ListBooksResponse> {
  const params: Record<string, string | number> = { page_size: pageSize };
  if (pageToken) params.page_token = pageToken;
  if (dimensionSlug) params.dimension_slug = dimensionSlug;
  if (status) params.status = status;
  const { data } = await apiClient.get<ListBooksResponse>('/books', { params });
  return data;
}

export async function getBook(id: string): Promise<GetBookResponse> {
  const { data } = await apiClient.get<GetBookResponse>(`/books/${id}`);
  return data;
}

export async function createBook(params: CreateBookParams): Promise<CreateBookResponse> {
  const { data } = await apiClient.post<CreateBookResponse>('/books', params);
  return data;
}

export type UpdateBookParams = Partial<CreateBookParams> & { id: string };

export async function updateBook(
  id: string,
  fields: Partial<CreateBookParams>,
  updateMask: string[],
): Promise<UpdateBookResponse> {
  const { data } = await apiClient.patch<UpdateBookResponse>(`/books/${id}`, {
    book: { id, ...fields },
    update_mask: updateMask.join(','),
  });
  return data;
}

export async function deleteBook(id: string): Promise<void> {
  await apiClient.delete(`/books/${id}`);
}

export async function uploadBookFile(bookId: string, file: File): Promise<{ id: string; file_path: string }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<{ id: string; file_path: string }>(
    `/books/${bookId}/upload`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export function downloadBookUrl(bookId: string): string {
  return `/api/v1/books/${bookId}/download`;
}

export async function downloadBookBlob(bookId: string): Promise<Blob> {
  const { data } = await apiClient.get(`/books/${bookId}/download`, { responseType: 'blob' });
  return data;
}
