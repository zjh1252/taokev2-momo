import { apiGet, apiPost } from '@/lib/http/client';
import type {
  AllianceLecturer721Application,
  AllianceLecturer721ApplyPayload,
} from './types';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export async function getMyLecturer721Application() {
  const res = await apiGet<ApiResponse<AllianceLecturer721Application | null>>(
    '/alliance/lecturers721/me/application',
  );
  return res.data;
}

export async function submitLecturer721Application(
  body: AllianceLecturer721ApplyPayload,
) {
  const res = await apiPost<ApiResponse<AllianceLecturer721Application>>(
    '/alliance/lecturers721/me/application',
    body,
  );
  return res.data;
}
