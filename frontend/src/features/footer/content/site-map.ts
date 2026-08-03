import { ROUTES } from '@/config/routes';
import { HOME_CATEGORY_MENU_ROWS } from '@/features/home/data/category-menu';

export type SiteMapLink = {
  label: string;
  href: string;
  external?: boolean;
};

export const SITE_MAP_CATEGORY_NAMES = HOME_CATEGORY_MENU_ROWS.flat();

export const SITE_MAP_MAIN_LINKS: SiteMapLink[] = [
  { label: '首页', href: ROUTES.HOME },
  { label: '内训招标', href: ROUTES.PUBLISH_DEMAND },
  { label: '内训投标', href: `${ROUTES.INTERNAL_COURSES}/supplier` },
  { label: '培训课程', href: ROUTES.PUBLIC_COURSES },
  { label: '培训讲师', href: ROUTES.TRAINERS },
  { label: '培训机构', href: ROUTES.INSTITUTIONS },
  { label: '培训资讯', href: ROUTES.ARTICLES },
  { label: '录播课程', href: ROUTES.ONLINE_COURSES },
  { label: '企业案例', href: '/cases' },
  { label: '发布需求', href: ROUTES.PUBLISH_DEMAND },
];

export const SITE_MAP_INDEX_LINKS: SiteMapLink[] = [
  { label: '公开课列表', href: ROUTES.PUBLIC_COURSES },
  { label: '内训课列表', href: ROUTES.INTERNAL_COURSES },
  { label: '培训师列表', href: ROUTES.TRAINERS },
  { label: '培训机构列表', href: ROUTES.INSTITUTIONS },
  { label: '录播课列表', href: ROUTES.ONLINE_COURSES },
  { label: '培训资讯列表', href: ROUTES.ARTICLES },
  { label: '企业案例列表', href: '/cases' },
  { label: '培训协会列表', href: ROUTES.ASSOCIATIONS },
  { label: '公开课供应商', href: `${ROUTES.PUBLIC_COURSES}/supplier` },
  { label: '内训课供应商', href: `${ROUTES.INTERNAL_COURSES}/supplier` },
];

export const SITE_MAP_CITY_LINKS: SiteMapLink[] = [
  { label: '上海', href: '/city/shanghai' },
  { label: '北京', href: '/city/beijing' },
  { label: '广州', href: '/city/guangzhou' },
  { label: '杭州', href: '/city/hangzhou' },
  { label: '深圳', href: '/city/shenzhen' },
  { label: '宁波', href: '/city/ningbo' },
  { label: '南京', href: '/city/nanjing' },
  { label: '苏州', href: '/city/suzhou' },
  { label: '青岛', href: '/city/qingdao' },
  { label: '武汉', href: '/city/wuhan' },
  { label: '重庆', href: '/city/chongqing' },
  { label: '厦门', href: '/city/xiamen' },
  { label: '天津', href: '/city/tianjin' },
  { label: '长沙', href: '/city/changsha' },
  { label: '西安', href: '/city/xian' },
  { label: '大连', href: '/city/dalian' },
  { label: '成都', href: '/city/chengdu' },
];

export const SITE_MAP_KEYWORDS = [
  '企业培训',
  '管理培训',
  '公开课',
  '企业内训',
  '培训讲师',
  '培训机构',
  '领导力培训',
  '销售培训',
  '人力资源培训',
  '项目管理培训',
  '生产管理培训',
  '财务培训',
  '采购培训',
  '培训需求',
];

export function buildSearchHref(keyword: string): string {
  return `${ROUTES.SEARCH}?keyword=${encodeURIComponent(keyword)}`;
}
