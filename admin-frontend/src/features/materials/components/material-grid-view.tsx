'use client';

import { AssetImage } from '@/components/admin/asset-image';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';
import {
  AVATAR_SCENE_MAP,
  COVER_SCENE_MAP,
  type MaterialType
} from '../constants';
import type { Material } from '../api/types';
import { CellAction } from './materials-table/cell-action';

type MaterialGridViewProps = {
  materialType: MaterialType;
  items: Material[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onToggleAll: (checked: boolean) => void;
};

export function MaterialGridView({
  materialType,
  items,
  selectedIds,
  onToggle,
  onToggleAll
}: MaterialGridViewProps) {
  const sceneMap = materialType === 'COVER' ? COVER_SCENE_MAP : AVATAR_SCENE_MAP;
  const allSelected = items.length > 0 && selectedIds.length === items.length;

  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2'>
        <Checkbox
          checked={allSelected}
          onCheckedChange={(value) => onToggleAll(!!value)}
        />
        <span className='text-muted-foreground text-sm'>全选当前页</span>
      </div>

      {items.length === 0 ? (
        <p className='text-muted-foreground py-10 text-center text-sm'>
          暂无素材
        </p>
      ) : (
        <div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
          {items.map((item) => {
            const checked = selectedIds.includes(item.id);
            return (
              <div key={item.id} className='space-y-2 rounded-lg border p-3'>
                <div className='flex items-center justify-between'>
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggle(item.id)}
                  />
                  <Badge variant={item.enabled ? 'default' : 'secondary'}>
                    {item.enabled ? '已启用' : '已禁用'}
                  </Badge>
                </div>

                <button
                  type='button'
                  className={`relative mx-auto block overflow-hidden bg-muted ${
                    materialType === 'AVATAR'
                      ? 'h-28 w-28 rounded-full'
                      : 'h-28 w-full rounded-md'
                  }`}
                  onClick={() => {
                    const url = resolveAssetUrl(item.url);
                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <AssetImage
                    src={item.url}
                    alt={item.name}
                    fill
                    wrapperClassName={
                      materialType === 'AVATAR'
                        ? 'h-28 w-28 rounded-full'
                        : 'h-28 w-full rounded-md'
                    }
                    className='object-cover'
                  />
                </button>

                <div className='space-y-1'>
                  <p className='truncate text-sm font-medium'>{item.name}</p>
                  <p className='text-muted-foreground truncate text-xs'>
                    {materialType === 'COVER'
                      ? `${item.category} · ${sceneMap[item.scene] ?? item.scene}`
                      : sceneMap[item.scene] ?? item.scene}
                  </p>
                  <div className='flex items-center justify-between text-xs'>
                    <Badge variant={item.isDefault ? 'default' : 'outline'}>
                      {item.isDefault ? '默认' : '非默认'}
                    </Badge>
                    <span className='text-muted-foreground'>
                      使用 {item.usageCount}
                    </span>
                  </div>
                </div>

                <CellAction data={item} materialType={materialType} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
