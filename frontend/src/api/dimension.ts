import apiClient from './client';

export interface DimensionDTO {
  id: string;
  name: string;
  slug: string;
  parent_id: string;
  sort_order: number;
  children: DimensionDTO[];
}

interface ListDimensionsResponse {
  dimensions: DimensionDTO[];
}

interface GetDimensionResponse {
  dimension: DimensionDTO;
}

interface CreateDimensionResponse {
  dimension: DimensionDTO;
}

interface UpdateDimensionResponse {
  dimension: DimensionDTO;
}

export async function listDimensions(): Promise<ListDimensionsResponse> {
  const { data } = await apiClient.get<ListDimensionsResponse>('/dimensions');
  return data;
}

export async function getDimension(slug: string): Promise<GetDimensionResponse> {
  const { data } = await apiClient.get<GetDimensionResponse>(`/dimensions/${slug}`);
  return data;
}

export async function createDimension(params: {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  parent_slug?: string;
}): Promise<CreateDimensionResponse> {
  const { data } = await apiClient.post<CreateDimensionResponse>('/dimensions', params);
  return data;
}

export async function updateDimension(
  slug: string,
  params: { name: string; description: string; sort_order: number },
): Promise<UpdateDimensionResponse> {
  const { data } = await apiClient.patch<UpdateDimensionResponse>(`/dimensions/${slug}`, params);
  return data;
}

export async function deleteDimension(slug: string): Promise<void> {
  await apiClient.delete(`/dimensions/${slug}`);
}

export async function listSubcategories(parentSlug: string): Promise<{ subcategories: DimensionDTO[] }> {
  const { data } = await apiClient.get<{ subcategories: DimensionDTO[] }>(
    `/dimensions/${parentSlug}/subcategories`,
  );
  return data;
}
