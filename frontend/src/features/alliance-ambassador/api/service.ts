import { apiGet, apiPost } from '@/lib/http/client';
import type {
  AllianceAmbassadorApplication,
  AllianceAmbassadorApplyPayload,
} from './types';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export async function getMyAmbassadorApplication() {
  const res = await apiGet<ApiResponse<AllianceAmbassadorApplication | null>>(
    '/alliance/ambassadors/me/application',
  );
  return res.data;
}

export async function submitAmbassadorApplication(
  body: AllianceAmbassadorApplyPayload,
) {
  const res = await apiPost<ApiResponse<AllianceAmbassadorApplication>>(
    '/alliance/ambassadors/me/application',
    body,
  );
  return res.data;
}
