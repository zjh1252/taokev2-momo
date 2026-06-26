/** 课程封面素材分类（与 sys_categories COURSE_CATEGORY 一级分类一致） */
export const COVER_CATEGORY_OPTIONS = [
  '经营战略',
  '市场营销',
  '销售管理',
  '客户服务',
  '人力资源',
  '培训发展',
  '研发管理',
  '项目管理',
  '采购管理',
  '物流管理',
  '生产管理',
  '质量管理',
  '职业素养',
  '职业技能',
  '语言',
  '财务税务',
  '国学/心理学',
  '行政/法规',
  '领导力',
  'MBA/总裁班',
  '新技术',
  '家庭亲子',
  '健康养生',
  '党政爱国',
  '政经',
  '新媒体',
  '其它'
] as const;

export const COVER_SCENE_OPTIONS = [
  { value: 'GENERAL', label: '通用' },
  { value: 'OPEN', label: '公开课' },
  { value: 'INTERNAL', label: '内训课' },
  { value: 'VIDEO', label: '录播课' }
] as const;

export const AVATAR_SCENE_OPTIONS = [
  { value: 'TRAINER', label: '专家头像' },
  { value: 'INSTITUTION', label: '机构头像' }
] as const;

export const COVER_SCENE_MAP = Object.fromEntries(
  COVER_SCENE_OPTIONS.map((o) => [o.value, o.label])
) as Record<string, string>;

export const AVATAR_SCENE_MAP = Object.fromEntries(
  AVATAR_SCENE_OPTIONS.map((o) => [o.value, o.label])
) as Record<string, string>;

export const DEFAULT_FILTER_OPTIONS = [
  { value: 'true', label: '默认素材' },
  { value: 'false', label: '非默认素材' }
] as const;

export const ENABLED_FILTER_OPTIONS = [
  { value: 'true', label: '已启用' },
  { value: 'false', label: '已禁用' }
] as const;

export const BATCH_ACTION_OPTIONS = [
  { value: 'DELETE', label: '删除' },
  { value: 'ENABLE', label: '启用' },
  { value: 'DISABLE', label: '禁用' },
  { value: 'SET_DEFAULT', label: '设为默认' },
  { value: 'UNSET_DEFAULT', label: '取消默认' }
] as const;

export type MaterialType = 'COVER' | 'AVATAR';

export type BatchAction = (typeof BATCH_ACTION_OPTIONS)[number]['value'];
