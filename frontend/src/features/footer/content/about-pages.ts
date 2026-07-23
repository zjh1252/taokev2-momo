import { LEGACY_ABOUT_HTML } from '@/features/footer/content/legacy-bodies';

export type AboutPageContent = {
  title: string;
  /** 老站原文 HTML，原样渲染 */
  html: string;
};

/**
 * 底部静态页：标题用页脚文案，正文直接抄老站
 * 期刊 / DISC 为外链，不在此表
 *
 * @author Fangxinxin
 * @date 2026-07-23 16:20
 */
export const ABOUT_PAGES: Record<string, AboutPageContent> = {
  taoke: {
    title: '关于淘课',
    html: LEGACY_ABOUT_HTML.taoke,
  },
  careers: {
    title: '招聘英才',
    html: LEGACY_ABOUT_HTML.careers,
  },
  business: {
    title: '商务合作',
    html: LEGACY_ABOUT_HTML.business,
  },
  ads: {
    title: '广告服务',
    html: LEGACY_ABOUT_HTML.ads,
  },
  terms: {
    title: '服务条款',
    html: LEGACY_ABOUT_HTML.terms,
  },
  legal: {
    title: '法律声明',
    html: LEGACY_ABOUT_HTML.legal,
  },
  privacy: {
    title: '隐私保护',
    html: LEGACY_ABOUT_HTML.privacy,
  },
  contact: {
    title: '联系我们',
    html: LEGACY_ABOUT_HTML.contact,
  },
  help: {
    title: '使用帮助',
    html: LEGACY_ABOUT_HTML.help,
  },
  /** 站点地图：先占位，正文后续再补 */
  sitemap: {
    title: '站点地图',
    html: '<p>站点地图内容建设中。</p>',
  },
};

export function getAboutPage(slug: string): AboutPageContent | null {
  return ABOUT_PAGES[slug] ?? null;
}
