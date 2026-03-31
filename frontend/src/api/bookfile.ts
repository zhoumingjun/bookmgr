import apiClient from './client';

export interface BookFileDTO {
  id: string;
  book_id: string;
  file_type: 'print' | 'digital' | 'audio' | 'video';
  original_name: string;
  file_size: number;
  mime_type: string;
  uploader_id: string;
  created_at: string;
}

interface ListBookFilesResponse {
  files: BookFileDTO[];
}

interface UploadBookFileResponse {
  file: BookFileDTO;
}


export async function listBookFiles(bookId: string): Promise<ListBookFilesResponse> {
  const { data } = await apiClient.get<ListBookFilesResponse>(`/books/${bookId}/files`);
  return data;
}

export async function uploadBookFile(
  bookId: string,
  fileType: 'print' | 'digital' | 'audio' | 'video',
  fileData: ArrayBuffer,
): Promise<UploadBookFileResponse> {
  // Encode as base64 for the proto bytes field
  const base64 = btoa(
    new Uint8Array(fileData)
      .reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  const { data } = await apiClient.post<UploadBookFileResponse>(`/books/${bookId}/files`, {
    book_id: bookId,
    file_type: fileType,
    file_data: base64,
  });
  return data;
}

export async function deleteBookFile(bookId: string, fileId: string): Promise<void> {
  await apiClient.delete(`/books/${bookId}/files/${fileId}`);
}

export function downloadBookFileUrl(bookId: string, fileId: string): string {
  return `/api/v1/books/${bookId}/files/${fileId}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}
