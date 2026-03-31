import apiClient from './client';
import type { BookDTO } from './books';

export interface FavoriteBookDTO {
  id: string;
  book: BookDTO;
  created_at: string;
}

export interface BookFeedbackDTO {
  id: string;
  book_id: string;
  user_id: string;
  feedback_type: 'read_start' | 'read_complete' | 'difficulty_rating' | 'use_scenario';
  difficulty_rating: number;
  use_scenario: string;
  created_at: string;
}

export interface FeedbackStatsDTO {
  favorite_count: number;
  read_complete_count: number;
  avg_difficulty_rating: number;
}

export interface ListFavoritesResponse {
  favorites: FavoriteBookDTO[];
  next_page_token: string;
}

export interface ListFeedbackResponse {
  feedbacks: BookFeedbackDTO[];
  next_page_token: string;
}

export async function listMyFavorites(pageSize = 20, pageToken = ''): Promise<ListFavoritesResponse> {
  const params: Record<string, string | number> = { page_size: pageSize };
  if (pageToken) params.page_token = pageToken;
  const { data } = await apiClient.get<ListFavoritesResponse>('/users/me/favorites', { params });
  return data;
}

export async function listMyFeedback(pageSize = 20, pageToken = ''): Promise<ListFeedbackResponse> {
  const params: Record<string, string | number> = { page_size: pageSize };
  if (pageToken) params.page_token = pageToken;
  const { data } = await apiClient.get<ListFeedbackResponse>('/users/me/feedback', { params });
  return data;
}

export async function favoriteBook(bookId: string): Promise<{ favorited: boolean }> {
  const { data } = await apiClient.post<{ favorited: boolean }>(`/books/${bookId}/favorite`, {});
  return data;
}

export async function unfavoriteBook(bookId: string): Promise<void> {
  await apiClient.delete(`/books/${bookId}/favorite`);
}

export async function getFavorite(bookId: string): Promise<{ is_favorited: boolean }> {
  const { data } = await apiClient.get<{ is_favorited: boolean }>(`/books/${bookId}/favorite`);
  return data;
}

export interface SubmitFeedbackParams {
  bookId: string;
  feedbackType: 'read_start' | 'read_complete' | 'difficulty_rating' | 'use_scenario';
  difficultyRating?: number;
  useScenario?: string;
}

export async function submitFeedback(params: SubmitFeedbackParams): Promise<{ feedback: BookFeedbackDTO }> {
  const body: Record<string, unknown> = {
    book_id: params.bookId,
    feedback_type: params.feedbackType,
  };
  if (params.difficultyRating !== undefined) body.difficulty_rating = params.difficultyRating;
  if (params.useScenario !== undefined) body.use_scenario = params.useScenario;
  const { data } = await apiClient.post<{ feedback: BookFeedbackDTO }>(`/books/${params.bookId}/feedback`, body);
  return data;
}

export async function getFeedbackStats(bookId: string): Promise<FeedbackStatsDTO> {
  const { data } = await apiClient.get<FeedbackStatsDTO>(`/books/${bookId}/feedback/stats`);
  return data;
}
