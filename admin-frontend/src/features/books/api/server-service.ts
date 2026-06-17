import { serverFetch } from '@/lib/server-fetch';
import type { BookFilters, BooksResponse } from './types';
import { buildBookParams } from './service';

export async function getBooksFromServer(
  filters: BookFilters
): Promise<BooksResponse> {
  return serverFetch<BooksResponse['data']>(
    `/admin/books?${buildBookParams(filters).toString()}`
  );
}
