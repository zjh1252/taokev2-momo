'use client';

import Image from 'next/image';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RecommendedResourceItem } from '../api/types';
import {
  buildHomeTrainerLayout,
  cellToSelection,
  enumeratePreviewSlots,
  isSelectionMatch,
  mapFixedToPreview,
  mapManagedToPreview,
  type HomeTrainerFixedLocks,
  type HomeTrainerSelection,
  type HomeTrainerSlotCell,
  type PreviewExpertView
} from '../utils/home-trainer-layout';
import {
  DraggableManagedCard,
  DroppablePreviewSlot
} from './home-trainer-dnd';

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
  const previewSlots = enumeratePreviewSlots(layout);
  const managedCount = layout.managedItems.length;
  const maxManaged = 4 - (locks.main ? 1 : 0) - (locks.middle ? 1 : 0);

  const mainSlot = previewSlots[0]!;
  const middleSlot = previewSlots[1]!;
  const sideSlots = [previewSlots[2]!, previewSlots[3]!];
  const mainManagedItem = mainSlot.cell.kind === 'managed' ? mainSlot.cell.item : null;
  const middleManagedItem = middleSlot.cell.kind === 'managed' ? middleSlot.cell.item : null;

  return (
    <div className='rounded-lg border p-4'>
      <div className='mb-3'>
        <h3 className='font-semibold'>预览区 · 首页-推荐专家</h3>
        <p className='text-muted-foreground text-xs'>
          展示首页四卡布局。默认前两张大卡固定；取消固定后专家按从左到右依次填入四个位置。已配置{' '}
          {managedCount}/{maxManaged} 位可管专家。支持拖动排序，也可从右侧专家列表拖入空位或已有卡片。
        </p>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-12 md:h-[360px]'>
        <PreviewSlotWrapper slot={mainSlot}>
          <MainCard
            cell={mainSlot.cell}
            expert={cellToExpert(mainSlot.cell)}
            selected={isCellSelected(selection, mainSlot.cell)}
            managedIndex={mainSlot.managedIndex}
            draggable={mainSlot.draggable}
            onSelect={() => {
              const sel = cellToSelection(mainSlot.cell);
              if (sel) onSelect(sel);
            }}
            onMoveUp={
              mainSlot.managedIndex != null && mainSlot.managedIndex > 0
                ? () => onMove(mainSlot.managedIndex!, -1)
                : undefined
            }
            onMoveDown={
              mainSlot.managedIndex != null &&
              mainSlot.managedIndex < layout.managedItems.length - 1
                ? () => onMove(mainSlot.managedIndex!, 1)
                : undefined
            }
            onRemove={
              mainManagedItem ? () => onRemove(mainManagedItem.id) : undefined
            }
          />
        </PreviewSlotWrapper>

        <PreviewSlotWrapper slot={middleSlot}>
          <MiddleCard
            cell={middleSlot.cell}
            expert={cellToExpert(middleSlot.cell)}
            selected={isCellSelected(selection, middleSlot.cell)}
            managedIndex={middleSlot.managedIndex}
            draggable={middleSlot.draggable}
            onSelect={() => {
              const sel = cellToSelection(middleSlot.cell);
              if (sel) onSelect(sel);
            }}
            onMoveUp={
              middleSlot.managedIndex != null && middleSlot.managedIndex > 0
                ? () => onMove(middleSlot.managedIndex!, -1)
                : undefined
            }
            onMoveDown={
              middleSlot.managedIndex != null &&
              middleSlot.managedIndex < layout.managedItems.length - 1
                ? () => onMove(middleSlot.managedIndex!, 1)
                : undefined
            }
            onRemove={
              middleManagedItem ? () => onRemove(middleManagedItem.id) : undefined
            }
          />
        </PreviewSlotWrapper>

        <div className='col-span-1 flex h-full flex-col gap-4 md:col-span-3'>
          {sideSlots.map((slot, index) => (
            <PreviewSlotWrapper key={slot.key} slot={slot}>
              {slot.cell.kind === 'empty' ? (
                <EmptySideSlot hint={sideEmptyHint(index, locks)} />
              ) : slot.cell.kind === 'managed' ? (
                (() => {
                  const managedCell = slot.cell;
                  const managedItem = managedCell.item;
                  return (
                    <SideCard
                      expert={mapManagedToPreview(managedItem, managedCell.layout)}
                      selected={isCellSelected(selection, managedCell)}
                      managedIndex={slot.managedIndex!}
                      itemId={managedItem.id}
                      draggable
                      onSelect={() => onSelect({ kind: 'managed', id: managedItem.id })}
                      onMoveUp={
                        slot.managedIndex! > 0 ? () => onMove(slot.managedIndex!, -1) : undefined
                      }
                      onMoveDown={
                        slot.managedIndex! < layout.managedItems.length - 1
                          ? () => onMove(slot.managedIndex!, 1)
                          : undefined
                      }
                      onRemove={() => onRemove(managedItem.id)}
                    />
                  );
                })()
              ) : null}
            </PreviewSlotWrapper>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewSlotWrapper({
  slot,
  children
}: {
  slot: ReturnType<typeof enumeratePreviewSlots>[number];
  children: React.ReactNode;
}) {
  const colClass =
    slot.key === 'main'
      ? 'col-span-1 min-h-0 md:col-span-6'
      : slot.key === 'middle'
        ? 'col-span-1 min-h-0 md:col-span-3'
        : 'min-h-0 flex-1';

  return (
    <DroppablePreviewSlot
      slotKey={slot.key}
      managedIndex={slot.managedIndex}
      droppable={slot.droppable}
      className={colClass}
    >
      {children}
    </DroppablePreviewSlot>
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
    return index === 0 ? '右侧上卡：拖动专家到此处' : '右侧下卡：拖动专家到此处';
  }
  return '空位：拖动专家到此处';
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

function CardActions({
  onMoveUp,
  onMoveDown,
  onRemove
}: {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
}) {
  if (!onMoveUp && !onMoveDown && !onRemove) return null;
  return (
    <div className='absolute top-2 right-2 flex gap-0.5'>
      {onMoveUp != null ? (
        <Button
          type='button'
          size='icon'
          variant='ghost'
          className='h-6 w-6'
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
        >
          <Icons.chevronUp className='h-3.5 w-3.5' />
        </Button>
      ) : null}
      {onMoveDown != null ? (
        <Button
          type='button'
          size='icon'
          variant='ghost'
          className='h-6 w-6'
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
        >
          <Icons.chevronDown className='h-3.5 w-3.5' />
        </Button>
      ) : null}
      {onRemove ? (
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
      ) : null}
    </div>
  );
}

function MainCard({
  cell,
  expert,
  selected,
  managedIndex,
  draggable,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove
}: {
  cell: HomeTrainerSlotCell;
  expert: PreviewExpertView | null;
  selected: boolean;
  managedIndex: number | null;
  draggable: boolean;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
}) {
  if (cell.kind === 'empty' || !expert) {
    return (
      <div className='text-muted-foreground flex h-full min-h-[120px] w-full items-center justify-center rounded-xl border border-dashed text-xs'>
        左侧大卡空位 · 拖动专家到此处
      </div>
    );
  }

  const body = (
    <button
      type='button'
      onClick={onSelect}
      className={`col-span-1 flex h-full w-full flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all md:flex-row ${cardShellClass(selected)} ${draggable ? 'pl-8' : ''}`}
    >
      <div className='relative h-40 shrink-0 overflow-hidden md:h-full md:w-[42%]'>
        <ExpertAvatar src={expert.coverUrl} alt={expert.name} className='object-cover' />
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

  if (draggable && cell.kind === 'managed' && managedIndex != null) {
    return (
      <DraggableManagedCard
        itemId={cell.item.id}
        managedIndex={managedIndex}
        name={expert.name}
        className='relative h-full min-h-[120px] w-full'
      >
        {body}
        <CardActions onMoveUp={onMoveUp} onMoveDown={onMoveDown} onRemove={onRemove} />
      </DraggableManagedCard>
    );
  }

  return (
    <div className='relative h-full min-h-[120px] w-full'>
      {body}
      <CardActions onMoveUp={onMoveUp} onMoveDown={onMoveDown} onRemove={onRemove} />
    </div>
  );
}

function MiddleCard({
  cell,
  expert,
  selected,
  managedIndex,
  draggable,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove
}: {
  cell: HomeTrainerSlotCell;
  expert: PreviewExpertView | null;
  selected: boolean;
  managedIndex: number | null;
  draggable: boolean;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
}) {
  if (cell.kind === 'empty' || !expert) {
    return (
      <div className='text-muted-foreground flex h-full min-h-[120px] w-full items-center justify-center rounded-xl border border-dashed text-xs'>
        中间大卡空位 · 拖动专家到此处
      </div>
    );
  }

  const body = (
    <button
      type='button'
      onClick={onSelect}
      className={`relative flex h-full w-full flex-col items-center overflow-hidden rounded-xl border bg-gradient-to-b from-slate-900 to-[#3b0a0a] px-4 pt-6 pb-4 text-white shadow-lg transition-all ${cardShellClass(selected)} ${draggable ? 'pl-8' : ''}`}
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

  if (draggable && cell.kind === 'managed' && managedIndex != null) {
    return (
      <DraggableManagedCard
        itemId={cell.item.id}
        managedIndex={managedIndex}
        name={expert.name}
        className='relative h-full min-h-[120px] w-full'
      >
        {body}
        <CardActions onMoveUp={onMoveUp} onMoveDown={onMoveDown} onRemove={onRemove} />
      </DraggableManagedCard>
    );
  }

  return (
    <div className='relative h-full min-h-[120px] w-full'>
      {body}
      <CardActions onMoveUp={onMoveUp} onMoveDown={onMoveDown} onRemove={onRemove} />
    </div>
  );
}

function SideCard({
  expert,
  selected,
  managedIndex,
  itemId,
  draggable,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove
}: {
  expert: PreviewExpertView;
  selected: boolean;
  managedIndex: number;
  itemId: number;
  draggable: boolean;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
}) {
  const body = (
    <>
      <button type='button' onClick={onSelect} className='flex flex-1 flex-col pl-6 text-left'>
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
      <CardActions onMoveUp={onMoveUp} onMoveDown={onMoveDown} onRemove={onRemove} />
    </>
  );

  const shellClass = `relative flex flex-1 flex-col rounded-xl border bg-white p-4 text-left shadow-sm transition-all ${cardShellClass(selected)}`;

  if (draggable) {
    return (
      <DraggableManagedCard
        itemId={itemId}
        managedIndex={managedIndex}
        name={expert.name}
        className={shellClass}
      >
        {body}
      </DraggableManagedCard>
    );
  }

  return <div className={shellClass}>{body}</div>;
}

function EmptySideSlot({ hint }: { hint: string }) {
  return (
    <div className='text-muted-foreground flex flex-1 items-center justify-center rounded-xl border border-dashed p-4 text-center text-xs'>
      {hint}
    </div>
  );
}
