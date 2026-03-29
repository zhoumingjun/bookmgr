import apiClient from './client';

export interface BookDTO {
  id: string;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  uploader_id: string;
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

export async function listBooks(pageSize = 20, pageToken = ''): Promise<ListBooksResponse> {
  const params: Record<string, string | number> = { page_size: pageSize };
  if (pageToken) params.page_token = pageToken;
  const { data } = await apiClient.get<ListBooksResponse>('/books', { params });
  return data;
}

export async function getBook(id: string): Promise<GetBookResponse> {
  const { data } = await apiClient.get<GetBookResponse>(`/books/${id}`);
  return data;
}

export async function createBook(title: string, author: string, description: string): Promise<CreateBookResponse> {
  const { data } = await apiClient.post<CreateBookResponse>('/books', { title, author, description });
  return data;
}

export async function updateBook(
  id: string,
  fields: { title?: string; author?: string; description?: string; cover_url?: string },
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
