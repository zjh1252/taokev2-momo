import { HOME_CATEGORY_MENU_ROWS } from '@/features/home/data/category-menu';
import type { CategoryTreeNode } from '../types';

/** 标准擅长领域一级分类名（27 项，末项为「其它」） */
export const STANDARD_TRAINER_EXPERTISE_L1_NAMES = HOME_CATEGORY_MENU_ROWS.flat();

/**
 * 过滤专家擅长领域树：仅保留标准一级分类（截止到「其它」），排除老站用户自定义分类。
 */
export function filterStandardTrainerExpertiseTree(
  tree: CategoryTreeNode[],
): CategoryTreeNode[] {
  const byName = new Map(tree.map((node) => [node.name, node]));
  return STANDARD_TRAINER_EXPERTISE_L1_NAMES.flatMap((name) => {
    const node = byName.get(name);
    return node ? [node] : [];
  });
}

/** 从分类树按 field slug（一级 或 一级_二级）解析擅长领域分类 ID */
export function resolveExpertiseCategoryId(
  tree: CategoryTreeNode[],
  field?: string,
): number | undefined {
  if (!field) return undefined;
  const [parentName, childName] = field.split('_');
  if (!parentName) return undefined;

  for (const lvl1 of tree) {
    if (lvl1.name === parentName) {
      if (!childName) return lvl1.id;
      const child = lvl1.children?.find((c) => c.name === childName);
      return child?.id;
    }
  }
  return undefined;
}
