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

export interface StaticPageItem {
  id: number;
  pageCode: string;
  title: string;
  content?: string | null;
  published: boolean;
  version: number;
}

export interface AdminFooterData {
  config: FooterConfig;
  sections: Record<string, FooterLinkItem[]>;
  pages: StaticPageItem[];
}

export interface ApiResp<T> {
  code: number;
  message: string;
  data: T;
}

export const FOOTER_SECTION_LABELS: Record<FooterSectionCode, string> = {
  NAV: '网站导航',
  ABOUT: '关于我们',
  BUSINESS: '商务服务',
  LEGAL: '法律声明',
  CONTACT: '联系我们'
};

export const FOOTER_SECTION_SLUGS: Record<FooterSectionCode, string> = {
  NAV: 'nav',
  ABOUT: 'about',
  BUSINESS: 'business',
  LEGAL: 'legal',
  CONTACT: 'contact'
};

export function footerSectionFromSlug(slug: string): FooterSectionCode | null {
  const matched = (Object.entries(FOOTER_SECTION_SLUGS) as [FooterSectionCode, string][]).find(
    ([, value]) => value === slug
  );
  return matched?.[0] ?? null;
}

export function footerSectionSlug(section: FooterSectionCode): string {
  return FOOTER_SECTION_SLUGS[section];
}

export const FOOTER_LINK_TYPE_LABELS: Record<FooterLinkType, string> = {
  INTERNAL: '站内路由',
  STATIC_PAGE: '静态页',
  EXTERNAL: '外链',
  NONE: '无跳转'
};
