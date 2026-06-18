'use client';

import Image from 'next/image';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RecommendedResourceItem } from '../api/types';
import {
  buildHomeTrainerLayout,
  cellToSelection,
  isSelectionMatch,
  mapFixedToPreview,
  mapManagedToPreview,
  type HomeTrainerFixedLocks,
  type HomeTrainerSelection,
  type HomeTrainerSlotCell,
  type PreviewExpertView
} from '../utils/home-trainer-layout';

export type { HomeTrainerSelection } from '../utils/home-trainer-layout';

type Props = {
  items: RecommendedResourceItem[];
  locks: HomeTrainerFixedLocks;
  selection: HomeTrainerSelection | null;
  onSelect: (selection: HomeTrainerSelection) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (id: number) => void;
};

export function HomeTrainerPreview({
  items,
  locks,
  selection,
  onSelect,
  onMove,
  onRemove
}: Props) {
  const layout = buildHomeTrainerLayout(locks, items);
  const managedCount = layout.managedItems.length;
  const maxManaged = 4 - (locks.main ? 1 : 0) - (locks.middle ? 1 : 0);

  return (
    <div className='rounded-lg border p-4'>
      <div className='mb-3'>
        <h3 className='font-semibold'>预览区 · 首页-推荐专家</h3>
        <p className='text-muted-foreground text-xs'>
          展示首页四卡布局。默认前两张大卡固定；取消固定后专家按从左到右依次填入四个位置。已配置{' '}
          {managedCount}/{maxManaged} 位可管专家。
        </p>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-12 md:h-[360px]'>
        <MainCard
          cell={layout.main}
          expert={cellToExpert(layout.main)}
          selected={isCellSelected(selection, layout.main)}
          onSelect={() => {
            const sel = cellToSelection(layout.main);
            if (sel) onSelect(sel);
          }}
        />
        <MiddleCard
          cell={layout.middle}
          expert={cellToExpert(layout.middle)}
          selected={isCellSelected(selection, layout.middle)}
          onSelect={() => {
            const sel = cellToSelection(layout.middle);
            if (sel) onSelect(sel);
          }}
        />
        <div className='col-span-1 flex h-full flex-col gap-4 md:col-span-3'>
          {layout.sides.map((cell, index) => {
            if (cell.kind === 'empty') {
              return <EmptySideSlot key={`empty-${index}`} hint={sideEmptyHint(index, locks)} />;
            }
            if (cell.kind !== 'managed') {
              return null;
            }
            const expert = mapManagedToPreview(cell.item, cell.layout);
            const itemIndex = layout.managedItems.findIndex((item) => item.id === cell.item.id);
            return (
              <SideCard
                key={expert.key}
                expert={expert}
                selected={isCellSelected(selection, cell)}
                onSelect={() => onSelect({ kind: 'managed', id: cell.item.id })}
                onMoveUp={() => onMove(itemIndex, -1)}
                onMoveDown={() => onMove(itemIndex, 1)}
                onRemove={() => onRemove(cell.item.id)}
                canMoveUp={itemIndex > 0}
                canMoveDown={itemIndex < layout.managedItems.length - 1}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function cellToExpert(cell: HomeTrainerSlotCell): PreviewExpertView | null {
  if (cell.kind === 'fixed') return mapFixedToPreview(cell.slot);
  if (cell.kind === 'managed') return mapManagedToPreview(cell.item, cell.layout);
  return null;
}

function isCellSelected(
  selection: HomeTrainerSelection | null,
  cell: HomeTrainerSlotCell
): boolean {
  const target = cellToSelection(cell);
  return target ? isSelectionMatch(selection, target) : false;
}

function sideEmptyHint(index: number, locks: HomeTrainerFixedLocks): string {
  if (locks.main && locks.middle) {
    return index === 0 ? '右侧上卡：请从专家列表推荐' : '右侧下卡：请从专家列表推荐';
  }
  return '空位：请从专家列表推荐专家';
}

function cardShellClass(selected: boolean) {
  return selected
    ? 'ring-2 ring-primary border-primary'
    : 'border-slate-200 hover:border-primary/40';
}

function ExpertAvatar({
  src,
  alt,
  className,
  size
}: {
  src: string;
  alt: string;
  className?: string;
  size?: number;
}) {
  if (!src) {
    return (
      <div
        className={`bg-muted text-muted-foreground flex items-center justify-center ${className ?? ''}`}
      >
        <Icons.user className='h-5 w-5' />
      </div>
    );
  }
  if (size) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={className}
        unoptimized
      />
    );
  }
  return <Image src={src} alt={alt} fill className={className} unoptimized />;
}

function MainCard({
  cell,
  expert,
  selected,
  onSelect
}: {
  cell: HomeTrainerSlotCell;
  expert: PreviewExpertView | null;
  selected: boolean;
  onSelect: () => void;
}) {
  if (cell.kind === 'empty' || !expert) {
    return (
      <div className='text-muted-foreground col-span-1 flex h-full items-center justify-center rounded-xl border border-dashed text-xs md:col-span-6'>
        左侧大卡空位
      </div>
    );
  }

  return (
    <button
      type='button'
      onClick={onSelect}
      className={`col-span-1 flex h-full flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all md:col-span-6 md:flex-row ${cardShellClass(selected)}`}
    >
      <div className='relative h-40 shrink-0 overflow-hidden md:h-full md:w-[42%]'>
        <ExpertAvatar
          src={expert.coverUrl}
          alt={expert.name}
          className='object-cover'
        />
        {expert.badge ? (
          <span className='absolute top-3 left-3 z-10 rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-white'>
            {expert.badge}
          </span>
        ) : null}
        {expert.isFixed ? (
          <Badge variant='secondary' className='absolute top-3 right-3 z-10 text-[10px]'>
            固定
          </Badge>
        ) : null}
      </div>
      <div className='flex flex-1 flex-col p-4'>
        <h4 className='text-lg font-black text-slate-800'>
          {expert.name}
          {expert.positionTitle ? (
            <span className='ml-2 text-sm font-normal text-slate-500'>{expert.positionTitle}</span>
          ) : null}
        </h4>
        {expert.oneLineIntro ? (
          <p className='text-primary mt-1 text-xs font-bold'>{expert.oneLineIntro}</p>
        ) : null}
        <p className='text-muted-foreground mt-2 line-clamp-3 text-xs leading-relaxed'>
          {expert.chiefIntro || expert.oneLineIntro}
        </p>
        <div className='mt-auto flex flex-wrap gap-1 pt-3'>
          {expert.tags.map((tag) => (
            <span key={tag} className='rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600'>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function MiddleCard({
  cell,
  expert,
  selected,
  onSelect
}: {
  cell: HomeTrainerSlotCell;
  expert: PreviewExpertView | null;
  selected: boolean;
  onSelect: () => void;
}) {
  if (cell.kind === 'empty' || !expert) {
    return (
      <div className='text-muted-foreground col-span-1 flex h-full items-center justify-center rounded-xl border border-dashed text-xs md:col-span-3'>
        中间大卡空位
      </div>
    );
  }

  return (
    <button
      type='button'
      onClick={onSelect}
      className={`relative col-span-1 flex h-full flex-col items-center overflow-hidden rounded-xl border bg-gradient-to-b from-slate-900 to-[#3b0a0a] px-4 pt-6 pb-4 text-white shadow-lg transition-all md:col-span-3 ${cardShellClass(selected)}`}
    >
      {expert.isFixed ? (
        <Badge variant='secondary' className='absolute top-3 right-3 text-[10px]'>
          固定
        </Badge>
      ) : null}
      <div className='mb-3 h-20 w-20 overflow-hidden rounded-full border-4 border-primary/30'>
        <ExpertAvatar
          src={expert.avatarUrl}
          alt={expert.name}
          size={80}
          className='h-full w-full object-cover'
        />
      </div>
      <h4 className='text-base font-bold'>{expert.name}</h4>
      <p className='mt-2 line-clamp-3 text-center text-[11px] leading-relaxed text-white/80'>
        {expert.oneLineIntro || expert.chiefIntro}
      </p>
      <div className='mt-3 flex flex-wrap justify-center gap-1'>
        {expert.tags.map((tag) => (
          <span
            key={tag}
            className='rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[10px]'
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

function SideCard({
  expert,
  selected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
  canMoveUp,
  canMoveDown
}: {
  expert: PreviewExpertView;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div
      className={`relative flex flex-1 flex-col rounded-xl border bg-white p-4 text-left shadow-sm transition-all ${cardShellClass(selected)}`}
    >
      <button type='button' onClick={onSelect} className='flex flex-1 flex-col text-left'>
        <div className='mb-2 flex items-start gap-3'>
          <div className='h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-100'>
            <ExpertAvatar
              src={expert.avatarUrl}
              alt={expert.name}
              size={48}
              className='h-full w-full object-cover'
            />
          </div>
          <div className='min-w-0'>
            <h4 className='truncate text-sm font-bold text-slate-800'>{expert.name}</h4>
            <p className='text-muted-foreground mt-0.5 line-clamp-1 text-[11px]'>
              {expert.positionTitle || expert.oneLineIntro}
            </p>
          </div>
        </div>
        {expert.oneLineIntro ? (
          <p className='text-muted-foreground line-clamp-2 text-[11px] leading-relaxed'>
            {expert.oneLineIntro}
          </p>
        ) : null}
        <div className='mt-2 flex flex-wrap gap-1'>
          {expert.tags.slice(0, 2).map((tag) => (
            <span key={tag} className='rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500'>
              {tag}
            </span>
          ))}
        </div>
      </button>
      <div className='absolute top-2 right-2 flex gap-0.5'>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          className='h-6 w-6'
          disabled={!canMoveUp}
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
        >
          <Icons.chevronUp className='h-3.5 w-3.5' />
        </Button>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          className='h-6 w-6'
          disabled={!canMoveDown}
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
        >
          <Icons.chevronDown className='h-3.5 w-3.5' />
        </Button>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          className='text-destructive h-6 w-6'
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Icons.trash className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  );
}

function EmptySideSlot({ hint }: { hint: string }) {
  return (
    <div className='text-muted-foreground flex flex-1 items-center justify-center rounded-xl border border-dashed p-4 text-center text-xs'>
      {hint}
    </div>
  );
}
