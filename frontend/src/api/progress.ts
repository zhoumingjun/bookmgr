import apiClient from './client';

export interface ReadingProgressDTO {
  id: string;
  book_id: string;
  user_id: string;
  progress_percent: number;
  last_page: number;
  last_read_at: string;
}

export async function getReadingProgress(bookId: string): Promise<ReadingProgressDTO | null> {
  try {
    const { data } = await apiClient.get(`/books/${bookId}/reading-progress`);
    return data.progress || null;
  } catch {
    return null;
  }
}

export async function updateReadingProgress(
  bookId: string,
  progressPercent: number,
  lastPage: number,
): Promise<void> {
  await apiClient.put(`/books/${bookId}/reading-progress`, {
    book_id: bookId,
    progress_percent: progressPercent,
    last_page: lastPage,
  });
}
