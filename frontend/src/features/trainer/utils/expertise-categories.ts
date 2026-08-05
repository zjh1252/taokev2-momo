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

/** 统计二级叶子名在树中的出现次数 */
export function countExpertiseLeafName(tree: CategoryTreeNode[], leafName: string): number {
  if (!leafName) return 0;
  let count = 0;
  for (const lvl1 of tree) {
    if (lvl1.children?.some((c) => c.name === leafName)) {
      count += 1;
    }
  }
  return count;
}

/** 二级名在擅长领域树中是否全局唯一 */
export function isUniqueExpertiseLeafName(tree: CategoryTreeNode[], leafName: string): boolean {
  return countExpertiseLeafName(tree, leafName) === 1;
}

/**
 * 将 UI 一级/二级名合并为 SEO field 值。
 * <p>二级名全局唯一时仅写二级；重名时写 {@code 一级_二级}；仅一级时写一级。</p>
 */
export function joinFieldValue(
  parentName: string | null,
  childName: string | null,
  tree: CategoryTreeNode[] = [],
): string {
  if (parentName && childName) {
    if (tree.length > 0 && isUniqueExpertiseLeafName(tree, childName)) {
      return childName;
    }
    return `${parentName}_${childName}`;
  }
  if (parentName) return parentName;
  if (childName) return childName;
  return '';
}

/** 在树中查找一级（可选二级）节点 ID */
function findCategoryId(
  tree: CategoryTreeNode[],
  parentName: string,
  childName?: string,
): number | undefined {
  for (const lvl1 of tree) {
    if (lvl1.name === parentName) {
      if (!childName) return lvl1.id;
      const child = lvl1.children?.find((c) => c.name === childName);
      return child?.id;
    }
  }
  return undefined;
}

/** 按叶子名查找第一个匹配的二级节点（树序） */
function findFirstLeafByName(
  tree: CategoryTreeNode[],
  leafName: string,
): { parent: CategoryTreeNode; child: CategoryTreeNode } | undefined {
  for (const lvl1 of tree) {
    const child = lvl1.children?.find((c) => c.name === leafName);
    if (child) return { parent: lvl1, child };
  }
  return undefined;
}

/**
 * 从分类树按 field slug 解析擅长领域分类 ID。
 * <p>规则：含 {@code _} → 一级_二级；否则先匹配二级叶子，再匹配一级。</p>
 */
export function resolveExpertiseCategoryId(
  tree: CategoryTreeNode[],
  field?: string,
): number | undefined {
  if (!field) return undefined;

  const underscore = field.indexOf('_');
  if (underscore >= 0) {
    const parentName = field.slice(0, underscore);
    const childName = field.slice(underscore + 1);
    if (!parentName || !childName) return undefined;
    return findCategoryId(tree, parentName, childName);
  }

  const leaf = findFirstLeafByName(tree, field);
  if (leaf) return leaf.child.id;

  return findCategoryId(tree, field);
}

/**
 * 将 field slug 还原为筛选 UI 所需的一级/二级名。
 */
export function splitFieldForFilter(
  tree: CategoryTreeNode[],
  field?: string,
): { fieldParentName?: string; fieldChildName?: string } {
  if (!field) return {};

  const underscore = field.indexOf('_');
  if (underscore >= 0) {
    const parentName = field.slice(0, underscore);
    const childName = field.slice(underscore + 1);
    return {
      fieldParentName: parentName || undefined,
      fieldChildName: childName || undefined,
    };
  }

  const leaf = findFirstLeafByName(tree, field);
  if (leaf) {
    return {
      fieldParentName: leaf.parent.name,
      fieldChildName: leaf.child.name,
    };
  }

  if (findCategoryId(tree, field)) {
    return { fieldParentName: field };
  }

  // 未知名称：当作一级展示，避免 UI 全空
  return { fieldParentName: field };
}

/**
 * 旧 {@code 一级_二级} 若二级唯一，规范化为仅二级名；否则返回 null（无需跳转）。
 */
export function canonicalizeTrainerSlugField(
  tree: CategoryTreeNode[],
  field?: string,
): string | null {
  if (!field) return null;
  const underscore = field.indexOf('_');
  if (underscore < 0) return null;
  const parentName = field.slice(0, underscore);
  const childName = field.slice(underscore + 1);
  if (!parentName || !childName) return null;
  if (!isUniqueExpertiseLeafName(tree, childName)) return null;
  // 校验父子关系确实存在，避免脏 URL 误跳
  if (!findCategoryId(tree, parentName, childName)) return null;
  return childName;
}
