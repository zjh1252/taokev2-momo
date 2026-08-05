import { apiGet, apiPost } from '@/lib/http/client';
import type {
  AlliancePartnerApplication,
  AlliancePartnerApplyPayload,
} from './types';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export async function getMyPartnerApplication() {
  const res = await apiGet<ApiResponse<AlliancePartnerApplication | null>>(
    '/alliance/partners/me/application',
  );
  return res.data;
}

export async function submitPartnerApplication(
  body: AlliancePartnerApplyPayload,
) {
  const res = await apiPost<ApiResponse<AlliancePartnerApplication>>(
    '/alliance/partners/me/application',
    body,
  );
  return res.data;
}
