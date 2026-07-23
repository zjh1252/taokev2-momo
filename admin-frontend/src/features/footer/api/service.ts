import { apiClient } from '@/lib/api-client';
import type {
  AdminFooterData,
  ApiResp,
  FooterConfig,
  FooterLinkItem,
  StaticPageItem
} from './types';

export type UpdateFooterConfigPayload = {
  brandTagline: string;
  companyIntro?: string;
  phone: string;
  mainQrImageUrl?: string | null;
  copyrightText: string;
  companyCopyrightText: string;
  companyCopyrightUrl?: string | null;
  icpText: string;
};

export type UpdateFooterLinkPayload = {
  label: string;
  linkType: string;
  linkTarget?: string;
  qrImageUrl?: string;
  sortOrder?: number;
  enabled?: boolean;
  openInNewTab?: boolean;
};

export type UpdateStaticPagePayload = {
  title: string;
  content?: string;
  published?: boolean;
};

export async function getAdminFooter() {
  return apiClient<ApiResp<AdminFooterData>>('/footer');
}

export async function updateFooterConfig(payload: UpdateFooterConfigPayload) {
  return apiClient<ApiResp<FooterConfig>>('/footer/config', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function updateFooterLink(itemCode: string, payload: UpdateFooterLinkPayload) {
  return apiClient<ApiResp<FooterLinkItem>>(`/footer/links/${encodeURIComponent(itemCode)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function getStaticPage(pageCode: string) {
  return apiClient<ApiResp<StaticPageItem>>(`/footer/pages/${encodeURIComponent(pageCode)}`);
}

export async function updateStaticPage(pageCode: string, payload: UpdateStaticPagePayload) {
  return apiClient<ApiResp<StaticPageItem>>(`/footer/pages/${encodeURIComponent(pageCode)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}
