import type { PxbSortField } from '../pxb-sort';

export type PxbCourseListVariant = 'open' | 'internal';

export interface PxbPricePreset {
  key: string;
  label: string;
  min?: number;
  max?: number;
}

export interface PxbCourseListConfig {
  variant: PxbCourseListVariant;
  basePath: '/opencourse' | '/inhousecourse';
  isOpen: boolean;
  locationLabel: string;
  locationMode: 'plan' | 'trainer';
  pricePresets: PxbPricePreset[];
  sortFields: PxbSortField[];
  showTimeFilter: boolean;
  showEnrollStatus: boolean;
  listLayout: 'open' | 'internal';
  pageTitle: string;
}

export function resolvePricePresetFromConfig(
  config: PxbCourseListConfig,
  preset?: string,
): { priceMin?: number; priceMax?: number } | undefined {
  if (!preset) return undefined;
  const item = config.pricePresets.find((p) => p.key === preset);
  if (!item) return undefined;
  return { priceMin: item.min, priceMax: item.max };
}

export const PXB_OPEN_COURSE_CONFIG: PxbCourseListConfig = {
  variant: 'open',
  basePath: '/opencourse',
  isOpen: true,
  locationLabel: '开课省市',
  locationMode: 'plan',
  pricePresets: [
    { key: '', label: '不限' },
    { key: '1', label: '0-2000元', max: 2000 },
    { key: '2', label: '2001-5000元', min: 2001, max: 5000 },
    { key: '3', label: '5001-10000元', min: 5001, max: 10000 },
    { key: '4', label: '10000以上', min: 10000 },
  ],
  sortFields: ['default', 'time', 'price', 'score'],
  showTimeFilter: true,
  showEnrollStatus: true,
  listLayout: 'open',
  pageTitle: '公开课列表',
};

export const PXB_INTERNAL_COURSE_CONFIG: PxbCourseListConfig = {
  variant: 'internal',
  basePath: '/inhousecourse',
  isOpen: false,
  locationLabel: '讲师常驻',
  locationMode: 'trainer',
  pricePresets: [
    { key: '', label: '不限' },
    { key: '1', label: '1万以下', max: 10000 },
    { key: '2', label: '1-2万元', min: 10001, max: 20000 },
    { key: '3', label: '2-3万元', min: 20001, max: 30000 },
    { key: '4', label: '3-5万元', min: 30001, max: 50000 },
    { key: '5', label: '5万元以上', min: 50001 },
  ],
  sortFields: ['default', 'price', 'score'],
  showTimeFilter: false,
  showEnrollStatus: false,
  listLayout: 'internal',
  pageTitle: '内训课列表',
};

export function getPxbCourseListConfig(variant: PxbCourseListVariant): PxbCourseListConfig {
  return variant === 'open' ? PXB_OPEN_COURSE_CONFIG : PXB_INTERNAL_COURSE_CONFIG;
}

export const PXB_SORT_LABELS: Record<PxbSortField, string> = {
  default: '默认',
  time: '开课时间',
  price: '价格',
  score: '评价',
};
