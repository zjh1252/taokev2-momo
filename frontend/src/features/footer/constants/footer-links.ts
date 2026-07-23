import { ROUTES } from '@/config/routes';

export type FooterNavItem = {
  label: string;
  /** 站内路径或完整外链 */
  href: string;
  external?: boolean;
  /** 外链是否新开标签；默认 true。期刊需同窗以便浏览器返回上一页 */
  openInNewTab?: boolean;
};

/** 网站导航（不含淘课百科；期刊/DISC 与老站同为外链） */
export const FOOTER_NAV_LINKS: FooterNavItem[] = [
  { label: '淘课网首页', href: ROUTES.HOME },
  {
    label: '《快乐培训》期刊',
    href: 'https://shequ.taoke.com/weekly',
    external: true,
    openInNewTab: false,
  },
  {
    label: 'DISC性格测评',
    href: 'http://eportal.taoke.com',
    external: true,
  },
  { label: '使用帮助', href: ROUTES.ABOUT_HELP },
  { label: '站点地图', href: ROUTES.ABOUT_SITEMAP },
];

export const FOOTER_ABOUT_LINKS: FooterNavItem[] = [
  { label: '关于淘课', href: ROUTES.ABOUT_TAOKE },
  { label: '联系我们', href: ROUTES.ABOUT_CONTACT },
  { label: '招聘英才', href: ROUTES.ABOUT_CAREERS },
];

export const FOOTER_BUSINESS_LINKS: FooterNavItem[] = [
  { label: '商务合作', href: ROUTES.ABOUT_BUSINESS },
  { label: '广告服务', href: ROUTES.ABOUT_ADS },
];

export const FOOTER_LEGAL_LINKS: FooterNavItem[] = [
  { label: '服务条款', href: ROUTES.ABOUT_TERMS },
  { label: '法律声明', href: ROUTES.ABOUT_LEGAL },
  { label: '隐私保护', href: ROUTES.ABOUT_PRIVACY },
];

export type FooterSocialKey = 'wechat' | 'douyin';

export const FOOTER_CONTACT_SOCIAL: Array<{
  key: FooterSocialKey;
  label: string;
  short: string;
  qrSrc: string;
  qrAlt: string;
}> = [
  {
    key: 'wechat',
    label: '微信公众号',
    short: '微',
    qrSrc: '/statics/images/about/social/wechat-qrcode.png',
    qrAlt: '培训人微信公众号二维码',
  },
  {
    key: 'douyin',
    label: '官方抖音号',
    short: '抖',
    qrSrc: '/statics/images/about/social/douyin-qrcode.png',
    qrAlt: '关乎天下抖音号二维码',
  },
];

export const FOOTER_BRAND = {
  tagline: '领先的企业培训采购平台',
  intro:
    '淘课网联合全国数万优秀培训师和培训机构,给企业提供有针对性的、互动的、积聚人脉的管理培训服务.包括提供培训需求诊断、培训课程采购、培训资料下载等服务！',
  phone: '400-169-7929',
  copyright: 'Copyright(C) 2006-2024 TAOKE.com All Rights Reserved.',
  company: '上海淘课企业管理咨询有限公司 版权所有',
  icp: '沪ICP备05034964号',
} as const;
