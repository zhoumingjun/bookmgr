import apiClient from './client';

export interface BookReviewDTO {
  id: string;
  book_id: string;
  reviewer_id: string;
  status_from: string;
  status_to: string;
  reason: string;
  reviewed_at: string;
}

interface SubmitForReviewResponse {
  book?: { id: string };
  review: BookReviewDTO;
}

interface ApproveBookResponse {
  book?: { id: string };
  review: BookReviewDTO;
}

interface RejectBookResponse {
  book?: { id: string };
  review: BookReviewDTO;
}

interface RecallBookResponse {
  book?: { id: string };
  review: BookReviewDTO;
}

interface ListBookReviewsResponse {
  reviews: BookReviewDTO[];
}

export async function submitForReview(bookId: string): Promise<SubmitForReviewResponse> {
  const { data } = await apiClient.post<SubmitForReviewResponse>(`/books/${bookId}:submit`, {});
  return data;
}

export async function approveBook(bookId: string, reason?: string): Promise<ApproveBookResponse> {
  const { data } = await apiClient.post<ApproveBookResponse>(`/books/${bookId}:approve`, {
    book_id: bookId,
    ...(reason ? { reason } : {}),
  });
  return data;
}

export async function rejectBook(bookId: string, reason: string): Promise<RejectBookResponse> {
  const { data } = await apiClient.post<RejectBookResponse>(`/books/${bookId}:reject`, {
    book_id: bookId,
    reason,
  });
  return data;
}

export async function recallBook(bookId: string): Promise<RecallBookResponse> {
  const { data } = await apiClient.post<RecallBookResponse>(`/books/${bookId}:recall`, {
    book_id: bookId,
  });
  return data;
}

export async function listBookReviews(bookId: string): Promise<ListBookReviewsResponse> {
  const { data } = await apiClient.get<ListBookReviewsResponse>(`/books/${bookId}/reviews`);
  return data;
}
