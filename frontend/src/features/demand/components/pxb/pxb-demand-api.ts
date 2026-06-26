import { apiGet } from '@/lib/http/client';
import { createDemand, createPublicDemand } from '../../api/service';
import type { CreateDemandRequest } from '../../api/types';
import { DemandType } from '../../api/types';
import { withCaptcha } from '@/lib/captcha';
import { useAuth } from '@/lib/auth/auth-context';

export type PxbDemandCourseKind = 'OPEN' | 'INTERNAL';

export interface PxbOpenDemandFormState {
  title: string;
  expertiseCategoryId?: number;
  expectedStartDate: string;
  provinceId?: number;
  cityId?: number;
  description: string;
  contactName: string;
  companyName: string;
  companyTel: string;
  contactPhone: string;
  contactEmail: string;
}

export interface PxbInternalDemandFormState {
  title: string;
  provinceId?: number;
  cityId?: number;
  description: string;
  expectedProposalCount: string;
  contactName: string;
  companyName: string;
  companyTel: string;
  contactPhone: string;
  contactEmail: string;
  sourceTrainerId?: number;
}

export function buildOpenDemandRequest(state: PxbOpenDemandFormState): CreateDemandRequest {
  return {
    demandType: DemandType.TRAINING,
    courseKind: 'OPEN',
    format: 'OFFLINE',
    title: state.title.trim(),
    trainingTopic: state.title.trim(),
    expectedStartDate: state.expectedStartDate || undefined,
    expertiseCategoryId: state.expertiseCategoryId,
    provinceId: state.provinceId,
    cityId: state.cityId,
    description: state.description.trim(),
    contactName: state.contactName.trim(),
    companyName: state.companyName.trim(),
    companyTel: state.companyTel.trim() || undefined,
    contactPhone: state.contactPhone.trim() || undefined,
    contactEmail: state.contactEmail.trim(),
  };
}

export function buildInternalDemandRequest(state: PxbInternalDemandFormState): CreateDemandRequest {
  return {
    demandType: DemandType.TRAINING,
    courseKind: 'INTERNAL',
    format: 'OFFLINE',
    title: state.title.trim(),
    trainingTopic: state.title.trim(),
    provinceId: state.provinceId,
    cityId: state.cityId,
    description: state.description.trim(),
    expectedProposalCount: Number(state.expectedProposalCount) || undefined,
    sourceTrainerId: state.sourceTrainerId,
    contactName: state.contactName.trim(),
    companyName: state.companyName.trim(),
    companyTel: state.companyTel.trim() || undefined,
    contactPhone: state.contactPhone.trim() || undefined,
    contactEmail: state.contactEmail.trim(),
  };
}

export async function submitPxbDemand(
  payload: CreateDemandRequest,
  options: { isLoggedIn: boolean; requireCaptcha: boolean },
): Promise<{ demandNo: string }> {
  const post = async (captchaToken?: string) => {
    const body = { ...payload, captchaToken };
    const result = options.isLoggedIn
      ? await createDemand(body)
      : await createPublicDemand(body);
    return { demandNo: result.demandNo };
  };

  if (options.requireCaptcha && !options.isLoggedIn) {
    return withCaptcha((token) => post(token));
  }
  return post();
}

export interface RegionItem {
  id: number;
  code: string;
  name: string;
}

export async function fetchProvinces(): Promise<RegionItem[]> {
  const res = await apiGet<{ data: RegionItem[] }>('/regions/children');
  return res.data || [];
}

export async function fetchCities(provinceCode: string): Promise<RegionItem[]> {
  const res = await apiGet<{ data: RegionItem[] }>(`/regions/children?parentCode=${provinceCode}`);
  return res.data || [];
}

/** Hook-free auth check helper for components */
export function usePxbDemandAuth() {
  const { user } = useAuth();
  return { isLoggedIn: !!user };
}
