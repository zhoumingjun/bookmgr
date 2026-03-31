import apiClient from './client';

export interface BookReviewDTO {
  id: string;
  book_id: string;
  reviewer_id: string;
  status_from: string;
  status_to: string;
  reason: string;
  created_at: string;
}

export async function listBookReviews(bookId: string): Promise<{ reviews: BookReviewDTO[] }> {
  const { data } = await apiClient.get(`/books/${bookId}/reviews`);
  return data;
}

export async function submitForReview(bookId: string): Promise<void> {
  await apiClient.post(`/books/${bookId}:submit`, { book_id: bookId });
}

export async function approveBook(bookId: string): Promise<void> {
  await apiClient.post(`/books/${bookId}:approve`, { book_id: bookId });
}

export async function rejectBook(bookId: string, reason: string): Promise<void> {
  await apiClient.post(`/books/${bookId}:reject`, { book_id: bookId, reason });
}

export async function recallReview(bookId: string): Promise<void> {
  await apiClient.post(`/books/${bookId}:recall`, { book_id: bookId });
}

export async function listPendingBooks(): Promise<{ books: unknown[] }> {
  const { data } = await apiClient.get(`/reviews/pending`);
  return data;
}
