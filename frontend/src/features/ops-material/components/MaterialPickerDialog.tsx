'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { resolveApiImageSrc } from '@/lib/media';
import { listOpsMaterials, pickOpsMaterial } from '../api/service';
import type { OpsMaterialItem, OpsMaterialType } from '../api/types';

type MaterialPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialType: OpsMaterialType;
  /** 课程分类名称（封面素材按分类筛选） */
  category?: string;
  /** 头像素材：TRAINER | INSTITUTION */
  scene?: string;
  title?: string;
  onSelect: (item: OpsMaterialItem) => void;
};

export function MaterialPickerDialog({
  open,
  onOpenChange,
  materialType,
  category,
  scene,
  title,
  onSelect
}: MaterialPickerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<OpsMaterialItem[]>([]);

  const loadMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await listOpsMaterials({
        materialType,
        category,
        scene,
        size: 60
      });
      setItems(resp.list);
    } catch (err) {
      toast.error((err as Error).message || '加载素材失败');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [materialType, category, scene]);

  useEffect(() => {
    if (open) {
      void loadMaterials();
    }
  }, [open, loadMaterials]);

  const handleSelect = async (item: OpsMaterialItem) => {
    try {
      await pickOpsMaterial(item.id);
    } catch {
      // 计数失败不阻断选用
    }
    onSelect(item);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-gray-800">
              {title || (materialType === 'COVER' ? '选择课程封面' : '选择头像素材')}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {category ? `当前分类：${category}` : '平台提供的标准素材'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-16">
              暂无可用素材，请联系平台管理员补充
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map((item) => {
                const previewSrc = resolveApiImageSrc(
                  item.url,
                  '/statics/images/taoke-new-logo.jpg',
                );
                return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handleSelect(item)}
                  className="rounded-lg border border-slate-200 p-2 text-left hover:border-primary hover:shadow-sm transition-all"
                >
                  <div
                    className={`relative mb-2 overflow-hidden bg-slate-100 ${
                      materialType === 'AVATAR'
                        ? 'mx-auto h-20 w-20 rounded-full'
                        : 'h-20 w-full rounded-md'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewSrc}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/statics/images/taoke-new-logo.jpg';
                      }}
                    />
                  </div>
                  <p className="truncate text-xs font-medium text-gray-700">
                    {item.name}
                  </p>
                  {item.isDefault ? (
                    <span className="text-[10px] text-primary">默认素材</span>
                  ) : null}
                </button>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
