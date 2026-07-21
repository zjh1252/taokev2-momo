import type { ApiResponse } from '@/features/trainer/types';

export type FooterLinkType = 'INTERNAL' | 'STATIC_PAGE' | 'EXTERNAL' | 'NONE';

export type FooterSectionCode = 'NAV' | 'ABOUT' | 'BUSINESS' | 'LEGAL' | 'CONTACT';

export interface FooterConfig {
  brandTagline: string;
  companyIntro: string;
  phone: string;
  mainQrImageUrl?: string | null;
  copyrightText: string;
  companyCopyrightText: string;
  companyCopyrightUrl?: string | null;
  icpText: string;
}

export interface FooterLinkItem {
  id: number;
  sectionCode: FooterSectionCode;
  itemCode: string;
  label: string;
  linkType: FooterLinkType;
  linkTarget?: string | null;
  href?: string | null;
  iconKey?: string | null;
  qrImageUrl?: string | null;
  sortOrder: number;
  enabled: boolean;
  openInNewTab: boolean;
}

export interface PublicFooterData {
  config: FooterConfig;
  sections: Record<string, FooterLinkItem[]>;
}

export interface StaticPageData {
  pageCode: string;
  title: string;
  content?: string | null;
}

export type PublicFooterResponse = ApiResponse<PublicFooterData>;
export type StaticPageResponse = ApiResponse<StaticPageData>;
