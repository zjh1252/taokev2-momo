import { apiGet } from '@/lib/http/client';
import { serverApiGet } from '@/lib/server-api';
import type {
  PublicFooterData,
  PublicFooterResponse,
  StaticPageData,
  StaticPageResponse
} from './types';
import { DEFAULT_FOOTER_DATA } from './defaults';

export async function getPublicFooterServer(): Promise<PublicFooterData> {
  try {
    const res = await serverApiGet<PublicFooterResponse>('/footer/public');
    return res.data ?? DEFAULT_FOOTER_DATA;
  } catch {
    return DEFAULT_FOOTER_DATA;
  }
}

export async function getPublicFooterClient(): Promise<PublicFooterData> {
  try {
    const res = await apiGet<PublicFooterResponse>('/footer/public', { silent: true, skipAuth: true });
    return res.data ?? DEFAULT_FOOTER_DATA;
  } catch {
    return DEFAULT_FOOTER_DATA;
  }
}

export async function getPublishedStaticPage(slug: string): Promise<StaticPageData | null> {
  try {
    const res = await serverApiGet<StaticPageResponse>(`/pages/public/${encodeURIComponent(slug)}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}
