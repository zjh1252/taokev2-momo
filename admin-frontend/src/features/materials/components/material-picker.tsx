'use client';

import { useState } from 'react';
import { AssetImage } from '@/components/admin/asset-image';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { resolveAssetUrl } from '@/lib/resolve-asset-url';
import { materialsQueryOptions } from '../api/queries';
import type { Material } from '../api/types';
import type { MaterialType } from '../constants';

type MaterialPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (material: Material) => void;
  materialType?: MaterialType;
  category?: string;
  scene?: string;
};

export function MaterialPicker({
  open,
  onOpenChange,
  onSelect,
  materialType = 'COVER',
  category,
  scene
}: MaterialPickerProps) {
  const { data: resp, isLoading } = useQuery(
    materialsQueryOptions({
      materialType,
      limit: 50,
      enabled: 'true',
      ...(category && { category }),
      ...(scene && { scene })
    })
  );

  const materials = resp?.data?.list ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>从素材库选择</DialogTitle>
          <DialogDescription>
            选择平台提供的标准{materialType === 'COVER' ? '封面' : '头像'}素材
          </DialogDescription>
        </DialogHeader>

        <div className='grid max-h-80 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4'>
          {isLoading ? (
            <div className='col-span-full flex justify-center py-8'>
              <Icons.spinner className='h-6 w-6 animate-spin' />
            </div>
          ) : materials.length === 0 ? (
            <p className='text-muted-foreground col-span-full py-8 text-center text-sm'>
              暂无可用素材
            </p>
          ) : (
            materials.map((item) => (
              <button
                key={item.id}
                type='button'
                className='hover:border-primary rounded-lg border p-2 text-left transition-colors'
                onClick={() => {
                  onSelect(item);
                  onOpenChange(false);
                }}
              >
                <div
                  className={`relative mb-2 overflow-hidden bg-muted ${
                    materialType === 'AVATAR'
                      ? 'mx-auto h-20 w-20 rounded-full'
                      : 'h-20 w-full rounded'
                  }`}
                >
                  <AssetImage
                    src={item.url}
                    alt={item.name}
                    fill
                    wrapperClassName={
                      materialType === 'AVATAR'
                        ? 'mx-auto h-20 w-20 rounded-full'
                        : 'h-20 w-full rounded'
                    }
                    className='object-cover'
                  />
                </div>
                <p className='truncate text-xs'>{item.name}</p>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MaterialPickerTrigger({
  materialType = 'COVER',
  category,
  scene,
  onSelect
}: Omit<MaterialPickerProps, 'open' | 'onOpenChange'>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type='button' variant='outline' size='sm' onClick={() => setOpen(true)}>
        从素材库选择
      </Button>
      {open ? (
        <MaterialPicker
          open={open}
          onOpenChange={setOpen}
          materialType={materialType}
          category={category}
          scene={scene}
          onSelect={onSelect}
        />
      ) : null}
    </>
  );
}
