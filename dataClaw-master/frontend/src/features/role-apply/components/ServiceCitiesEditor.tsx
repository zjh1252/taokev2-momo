'use client';

import { useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import RegionCascader from '@/components/region-cascader';
import type { ServiceCityItem } from '../api/types';

interface ServiceCitiesEditorProps {
  value: ServiceCityItem[];
  onChange: (value: ServiceCityItem[]) => void;
  disabled?: boolean;
}

const EMPTY_ITEM: ServiceCityItem = {
  provinceId: null,
  cityId: null,
  provinceName: undefined,
  cityName: undefined,
};

/**
 * 多服务城市编辑器 — 行级 RegionCascader（省 + 市 2 级）+ 删除按钮 + 「添加服务城市」按钮。
 *
 * <p>RegionCascader 内部维护选择状态，因此每行通过稳定 key 维持其内部 state；
 * 上层只需要消费 onChange 回写到 value。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 14:30
 */
export default function ServiceCitiesEditor({
  value,
  onChange,
  disabled,
}: ServiceCitiesEditorProps) {
  const items = value && value.length > 0 ? value : [];

  const handleRowChange = useCallback(
    (index: number, region: { provinceId?: number; provinceName?: string; cityId?: number; cityName?: string }) => {
      const next = [...items];
      next[index] = {
        provinceId: region.provinceId ?? null,
        cityId: region.cityId ?? null,
        provinceName: region.provinceName,
        cityName: region.cityName,
      };
      onChange(next);
    },
    [items, onChange],
  );

  const handleAdd = useCallback(() => {
    onChange([...items, { ...EMPTY_ITEM }]);
  }, [items, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      const next = items.filter((_, i) => i !== index);
      onChange(next);
    },
    [items, onChange],
  );

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-xs text-gray-400">暂未添加服务城市，点击下方按钮添加</p>
      )}

      {items.map((item, index) => (
        <div
          key={`service-city-${index}`}
          className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3"
        >
          <div className="flex-1 min-w-0">
            <RegionCascader
              maxLevel={2}
              disabled={disabled}
              onChange={(region) => handleRowChange(index, region)}
            />
            {item.provinceName && item.cityName && (
              <p className="mt-1 text-xs text-gray-500">
                已选：{item.provinceName} / {item.cityName}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleRemove(index)}
            className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="删除该服务城市"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        disabled={disabled}
        onClick={handleAdd}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="size-4" />
        添加服务城市
      </button>
    </div>
  );
}
