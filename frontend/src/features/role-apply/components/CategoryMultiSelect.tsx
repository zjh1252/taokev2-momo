'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { apiGet } from '@/lib/http/client';
import { cn } from '@/lib/utils';
import { filterStandardTrainerExpertiseTree } from '@/features/trainer/utils/expertise-categories';

interface CategoryNode {
  id: number;
  name: string;
  children?: CategoryNode[];
}

interface CategoryMultiSelectProps {
  /** 分类类型，如 TRAINER_INDUSTRY / TRAINER_EXPERTISE */
  type: string;
  /** 已选中的分类 ID 列表 */
  value: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}

/**
 * 一级分类多选 Chip 组件
 *
 * <p>拉取 {@code GET /categories/tree?type=...}，仅展示根级（一级）分类，
 * 以可点击 chip 方式呈现，多选切换。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-21 22:30
 */
export function CategoryMultiSelect({
  type,
  value,
  onChange,
  placeholder = '加载中...',
}: CategoryMultiSelectProps) {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet<{ data: CategoryNode[] }>(`/categories/tree?type=${encodeURIComponent(type)}`)
      .then((res) => {
        let data = res.data || [];
        // 擅长领域：仅保留标准一级分类（27 项），排除老站自定义标签，与首页行为一致
        if (type === 'TRAINER_EXPERTISE') {
          data = filterStandardTrainerExpertiseTree(data as any) as unknown as CategoryNode[];
        }
        setTree(data);
      })
      .catch(() => {
        setTree([]);
      })
      .finally(() => setLoading(false));
  }, [type]);

  const selected = new Set(value);
  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  if (loading) {
    return <div className="text-sm text-gray-400">{placeholder}</div>;
  }
  if (tree.length === 0) {
    return <div className="text-sm text-gray-400">暂无可选分类</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tree.map((node) => {
        const active = selected.has(node.id);
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => toggle(node.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-slate-200 bg-white text-gray-600 hover:border-primary/40 hover:bg-primary/5',
            )}
          >
            {active && <Check className="size-3" />}
            <span>{node.name}</span>
          </button>
        );
      })}
    </div>
  );
}
