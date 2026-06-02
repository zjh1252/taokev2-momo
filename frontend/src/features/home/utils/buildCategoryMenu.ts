import type { CategoryTreeNode } from '@/features/course/api/types';
import {
  CATEGORY_SHORT_LABELS,
  HOME_CATEGORY_MENU_ROWS,
} from '../data/category-menu';

export interface CategoryMenuItem {
  id: number;
  shortLabel: string;
  fullName: string;
  children: CategoryTreeNode[];
}

export interface CategoryMenuRow {
  rowIndex: number;
  items: CategoryMenuItem[];
}

/**
 * 将 API 分类树按首页行配置组装为侧栏 + 浮层数据结构
 */
export function buildCategoryMenuRows(
  categories: CategoryTreeNode[],
): CategoryMenuRow[] {
  const byName = new Map(categories.map((c) => [c.name, c]));

  return HOME_CATEGORY_MENU_ROWS.map((fullNames, rowIndex) => ({
    rowIndex,
    items: fullNames
      .map((fullName) => {
        const node = byName.get(fullName);
        if (!node) return null;
        return {
          id: node.id,
          shortLabel: CATEGORY_SHORT_LABELS[fullName] ?? fullName,
          fullName: node.name,
          children: node.children ?? [],
        };
      })
      .filter((item): item is CategoryMenuItem => item !== null),
  })).filter((row) => row.items.length > 0);
}
