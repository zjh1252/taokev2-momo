'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Icons } from '@/components/icons';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  AVATAR_SCENE_OPTIONS,
  COVER_CATEGORY_OPTIONS,
  COVER_SCENE_OPTIONS,
  type MaterialType
} from '../constants';

type MaterialBatchControlsProps = {
  materialType: MaterialType;
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onToggleAll: (checked: boolean) => void;
  onApplyCategory: (category: string) => void;
  onApplyScene: (scene: string) => void;
  onBatchEnable: () => void;
  onBatchDisable: () => void;
  onBatchDelete: () => void;
};

export function MaterialBatchControls({
  materialType,
  selectedCount,
  totalCount,
  allSelected,
  onToggleAll,
  onApplyCategory,
  onApplyScene,
  onBatchEnable,
  onBatchDisable,
  onBatchDelete
}: MaterialBatchControlsProps) {
  const sceneOptions =
    materialType === 'COVER' ? COVER_SCENE_OPTIONS : AVATAR_SCENE_OPTIONS;

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <div className='flex items-center gap-2'>
        <Checkbox
          checked={allSelected && totalCount > 0}
          onCheckedChange={(value) => onToggleAll(!!value)}
        />
        <span className='text-muted-foreground text-sm'>
          全选（{selectedCount}/{totalCount}）
        </span>
      </div>

      {materialType === 'COVER' ? (
        <div className='flex items-center gap-2'>
          <Label className='text-muted-foreground shrink-0 text-sm'>
            批量修改分类
          </Label>
          <Select onValueChange={onApplyCategory}>
            <SelectTrigger className='h-8 w-36'>
              <SelectValue placeholder='选择分类' />
            </SelectTrigger>
            <SelectContent>
              {COVER_CATEGORY_OPTIONS.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className='flex items-center gap-2'>
        <Label className='text-muted-foreground shrink-0 text-sm'>
          {materialType === 'COVER' ? '批量修改适用场景' : '批量修改类型'}
        </Label>
        <Select onValueChange={onApplyScene}>
          <SelectTrigger className='h-8 w-36'>
            <SelectValue placeholder='选择场景' />
          </SelectTrigger>
          <SelectContent>
            {sceneOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type='button'
        size='sm'
        variant='outline'
        disabled={selectedCount === 0}
        onClick={onBatchEnable}
      >
        批量启用
      </Button>
      <Button
        type='button'
        size='sm'
        variant='outline'
        disabled={selectedCount === 0}
        onClick={onBatchDisable}
      >
        批量禁用
      </Button>
      <Button
        type='button'
        size='sm'
        variant='destructive'
        disabled={selectedCount === 0}
        onClick={onBatchDelete}
      >
        <Icons.trash className='mr-1 h-4 w-4' />
        批量删除
      </Button>
    </div>
  );
}
