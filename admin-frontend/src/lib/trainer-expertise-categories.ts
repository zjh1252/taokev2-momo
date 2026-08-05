import type { CategoryNode } from '@/features/categories/api/types';

/** 标准擅长领域一级分类（与 C 端首页/专家筛选一致，共 27 项） */
export const STANDARD_TRAINER_EXPERTISE_L1_NAMES = [
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

/** 过滤擅长领域树：仅保留标准一级分类，排除老站自定义标签 */
export function filterStandardTrainerExpertiseTree(tree: CategoryNode[]): CategoryNode[] {
  const byName = new Map(tree.map((node) => [node.name, node]));
  return STANDARD_TRAINER_EXPERTISE_L1_NAMES.flatMap((name) => {
    const node = byName.get(name);
    return node ? [node] : [];
  });
}

/** 擅长行业：仅取分类树根节点（一级） */
export function getTrainerIndustryL1Options(tree: CategoryNode[]) {
  return tree.map((node) => ({ id: node.id, name: node.name }));
}
