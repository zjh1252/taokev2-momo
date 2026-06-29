'use client';

import { useRef, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import type { HomeTrainerFixedSlot } from '../constants/home-trainer-fixed';
import type { RecommendedResourceItem } from '../api/types';
import {
  isLikelyImageAssetUrl,
  isPlaceholderLegacyAvatar,
  resolveAssetUrl
} from '@/lib/resolve-asset-url';
import {
  buildHomeTrainerLayout,
  cellToSelection,
  DEFAULT_TRAINER_AVATAR,
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
  onRemove: (id: number) => void;
  onUnfix?: (slot: HomeTrainerFixedSlot) => void;
  onAvatarUpload?: (resourceId: number, file: File) => void;
  avatarUploadingId?: number | null;
};

export function HomeTrainerPreview({
  items,
  locks,
  selection,
  onSelect,
  onRemove,
  onUnfix,
  onAvatarUpload,
  avatarUploadingId
}: Props) {
  const layout = buildHomeTrainerLayout(locks, items);
  const previewSlots = enumeratePreviewSlots(layout);
  const managedCount = layout.managedItems.length;
  const maxManaged = 4 - (locks.main ? 1 : 0) - (locks.middle ? 1 : 0);

  const mainSlot = previewSlots[0]!;
  const middleSlot = previewSlots[1]!;
  const sideSlots = [previewSlots[2]!, previewSlots[3]!];

  const mainRemoveId = mainSlot.cell.kind === 'managed' ? mainSlot.cell.item.id : null;
  const middleRemoveId = middleSlot.cell.kind === 'managed' ? middleSlot.cell.item.id : null;

  const fixedSlotForCell = (cell: HomeTrainerSlotCell): HomeTrainerFixedSlot | null =>
    cell.kind === 'fixed' ? cell.slot : null;

  return (
    <div className='rounded-lg border p-4'>
      <div className='mb-3'>
        <h3 className='font-semibold'>预览区 · 首页-推荐专家</h3>
        <p className='text-muted-foreground text-xs'>
          展示首页四卡布局。默认前两张大卡固定；点击固定卡片可取消固定。已配置 {managedCount}/
          {maxManaged} 位可管专家。支持拖动排序，也可从右侧专家列表拖入空位或已有卡片。
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
            fixedSlot={fixedSlotForCell(mainSlot.cell)}
            onSelect={() => {
              const sel = cellToSelection(mainSlot.cell);
              if (sel) onSelect(sel);
            }}
            onUnfix={onUnfix}
            onAvatarUpload={onAvatarUpload}
            avatarUploading={
              mainSlot.cell.kind === 'managed' &&
              avatarUploadingId === mainSlot.cell.item.resourceId
            }
            onRemove={
              mainRemoveId !== null
                ? () => onRemove(mainRemoveId)
                : undefined
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
            fixedSlot={fixedSlotForCell(middleSlot.cell)}
            onSelect={() => {
              const sel = cellToSelection(middleSlot.cell);
              if (sel) onSelect(sel);
            }}
            onUnfix={onUnfix}
            onAvatarUpload={onAvatarUpload}
            avatarUploading={
              middleSlot.cell.kind === 'managed' &&
              avatarUploadingId === middleSlot.cell.item.resourceId
            }
            onRemove={
              middleRemoveId !== null
                ? () => onRemove(middleRemoveId)
                : undefined
            }
          />
        </PreviewSlotWrapper>

        <div className='col-span-1 flex h-full min-h-0 flex-col gap-3 md:col-span-3'>
          {sideSlots.map((slot, index) => {
            const managed = slot.cell.kind === 'managed' ? slot.cell : null;
            if (managed) {
              return (
                <PreviewSlotWrapper key={slot.key} slot={slot}>
                  <SideCard
                    expert={mapManagedToPreview(managed.item, managed.layout)}
                    selected={isCellSelected(selection, managed)}
                    managedIndex={slot.managedIndex!}
                    itemId={managed.item.id}
                    draggable
                    onSelect={() => onSelect({ kind: 'managed', id: managed.item.id })}
                    onAvatarUpload={onAvatarUpload}
                    avatarUploading={avatarUploadingId === managed.item.resourceId}
                    onRemove={() => onRemove(managed.item.id)}
                  />
                </PreviewSlotWrapper>
              );
            }
            return (
              <PreviewSlotWrapper key={slot.key} slot={slot}>
                <EmptySideSlot hint={sideEmptyHint(index, locks)} />
              </PreviewSlotWrapper>
            );
          })}
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
  children: ReactNode;
}) {
  const colClass =
    slot.key === 'main'
      ? 'col-span-1 flex min-h-0 md:col-span-6'
      : slot.key === 'middle'
        ? 'col-span-1 flex min-h-0 md:col-span-3'
        : 'flex min-h-0 flex-1 flex-col';

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
    : 'border-slate-100 hover:border-primary/40';
}

function SelectableCard({
  onSelect,
  className,
  children
}: {
  onSelect: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      role='button'
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={className}
    >
      {children}
    </div>
  );
}

function buildImageSources(...candidates: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const sources: string[] = [];

  for (const candidate of candidates) {
    const raw = candidate?.trim();
    if (!raw || isPlaceholderLegacyAvatar(raw)) continue;
    const resolved = raw.startsWith('http') || raw.startsWith('/') ? raw : resolveAssetUrl(raw);
    if (!resolved || !isLikelyImageAssetUrl(resolved) || seen.has(resolved)) continue;
    seen.add(resolved);
    sources.push(resolved);
  }

  const placeholder = resolveAssetUrl(DEFAULT_TRAINER_AVATAR);
  if (placeholder && !seen.has(placeholder)) {
    sources.push(placeholder);
  }

  return sources;
}

function ExpertAvatar({
  src,
  alt,
  className,
  size,
  fallbacks = []
}: {
  src: string;
  alt: string;
  className?: string;
  size?: number;
  fallbacks?: string[];
}) {
  const sources = useMemo(
    () => buildImageSources(src, ...fallbacks),
    [src, fallbacks]
  );
  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [sources.join('|')]);

  const displaySrc = sources[sourceIndex] ?? sources[sources.length - 1] ?? '';

  if (!displaySrc) {
    return (
      <div
        className={`bg-slate-100 text-muted-foreground flex items-center justify-center ${className ?? ''}`}
      >
        <Icons.user className='h-5 w-5' />
      </div>
    );
  }

  const imgClass = size
    ? className
    : `absolute inset-0 h-full w-full object-cover ${className ?? ''}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={displaySrc}
      src={displaySrc}
      alt={alt}
      width={size}
      height={size}
      loading='lazy'
      decoding='async'
      referrerPolicy='no-referrer'
      className={imgClass}
      onError={() => {
        setSourceIndex((index) => (index + 1 < sources.length ? index + 1 : index));
      }}
    />
  );
}

function ClickableAvatar({
  src,
  alt,
  className,
  size,
  resourceId,
  uploading,
  onUpload
}: {
  src: string;
  alt: string;
  className?: string;
  size?: number;
  resourceId?: number;
  uploading?: boolean;
  onUpload?: (resourceId: number, file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canUpload = Boolean(resourceId && onUpload && !uploading);

  return (
    <div className='relative shrink-0'>
      <button
        type='button'
        disabled={!canUpload}
        title={canUpload ? '点击更换头像' : undefined}
        className={`relative overflow-hidden ${canUpload ? 'group cursor-pointer' : 'cursor-default'} ${className ?? ''}`}
        onClick={(e) => {
          if (!canUpload) return;
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        <ExpertAvatar src={src} alt={alt} size={size} className='h-full w-full object-cover' />
        {canUpload ? (
          <span className='absolute inset-0 flex items-center justify-center bg-black/45 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100'>
            {uploading ? '上传中…' : '换头像'}
          </span>
        ) : null}
      </button>
      {canUpload ? (
        <input
          ref={inputRef}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && resourceId) onUpload!(resourceId, file);
            e.target.value = '';
          }}
        />
      ) : null}
    </div>
  );
}

function FixedUnfixBar({
  selected,
  fixedSlot,
  onUnfix
}: {
  selected: boolean;
  fixedSlot: HomeTrainerFixedSlot | null;
  onUnfix?: (slot: HomeTrainerFixedSlot) => void;
}) {
  if (!selected || !fixedSlot || !onUnfix) return null;
  return (
    <div className='absolute right-3 bottom-3 left-3 z-20 flex justify-center'>
      <Button
        type='button'
        size='sm'
        variant='secondary'
        className='h-7 bg-white/95 text-xs shadow-sm'
        onClick={(e) => {
          e.stopPropagation();
          onUnfix(fixedSlot);
        }}
      >
        取消固定
      </Button>
    </div>
  );
}

function CardActions({ onRemove }: { onRemove?: () => void }) {
  if (!onRemove) return null;
  return (
    <div className='absolute top-2 right-2 z-10'>
      <Button
        type='button'
        size='icon'
        variant='ghost'
        className='text-destructive h-6 w-6 bg-white/80'
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Icons.trash className='h-3.5 w-3.5' />
      </Button>
    </div>
  );
}

function PreviewCta({ variant }: { variant: 'main' | 'middle' }) {
  if (variant === 'main') {
    return (
      <span className='bg-primary mt-2 flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-[10px] font-bold text-white shadow-sm'>
        查看专家详情
      </span>
    );
  }
  return (
    <span className='border-primary/50 mt-auto w-full rounded-lg border py-2 text-center text-[10px] font-medium text-white/90'>
      查看专家详情
    </span>
  );
}

function ExpertTagList({
  tags,
  limit,
  className,
  tagClassName
}: {
  tags: string[];
  limit: number;
  className?: string;
  tagClassName: string;
}) {
  if (tags.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1 ${className ?? ''}`}>
      {tags.slice(0, limit).map((tag, index) => (
        <span key={`${index}-${tag}`} className={tagClassName}>
          {tag}
        </span>
      ))}
    </div>
  );
}

type CardCommonProps = {
  cell: HomeTrainerSlotCell;
  expert: PreviewExpertView | null;
  selected: boolean;
  managedIndex: number | null;
  draggable: boolean;
  fixedSlot: HomeTrainerFixedSlot | null;
  onSelect: () => void;
  onUnfix?: (slot: HomeTrainerFixedSlot) => void;
  onAvatarUpload?: (resourceId: number, file: File) => void;
  avatarUploading?: boolean;
  onRemove?: () => void;
};

function MainCard({
  cell,
  expert,
  selected,
  managedIndex,
  draggable,
  fixedSlot,
  onSelect,
  onUnfix,
  onAvatarUpload,
  avatarUploading,
  onRemove
}: CardCommonProps) {
  if (cell.kind === 'empty' || !expert) {
    return (
      <div className='text-muted-foreground flex h-full min-h-[120px] w-full items-center justify-center rounded-xl border border-dashed text-xs'>
        左侧大卡空位 · 拖动专家到此处
      </div>
    );
  }

  const body = (
    <SelectableCard
      onSelect={onSelect}
      className={`group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all md:flex-row ${cardShellClass(selected)} ${draggable ? 'pl-8' : ''}`}
    >
      <div className='relative h-36 shrink-0 overflow-hidden md:h-full md:w-[45%]'>
        <ExpertAvatar
          src={expert.coverUrl}
          fallbacks={[expert.avatarUrl]}
          alt={expert.name}
          className='object-cover'
        />
        <div className='absolute inset-y-0 right-0 z-10 hidden w-12 bg-gradient-to-r from-transparent to-white md:block' />
        {expert.badge ? (
          <span className='absolute top-2 left-2 z-20 rounded bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-md'>
            {expert.badge}
          </span>
        ) : null}
      </div>
      <div className='relative z-20 flex flex-1 flex-col p-3 md:p-4'>
        <h4 className='text-base font-black text-slate-800 md:text-lg'>
          {expert.name}
          {expert.positionTitle ? (
            <span className='ml-1.5 text-xs font-normal text-slate-500 md:text-sm'>
              {expert.positionTitle}
            </span>
          ) : null}
        </h4>
        {expert.oneLineIntro ? (
          <p className='text-primary mt-1 text-[10px] font-bold md:text-xs'>{expert.oneLineIntro}</p>
        ) : null}
        <p className='text-muted-foreground mt-1.5 line-clamp-3 text-[10px] leading-relaxed md:text-xs'>
          {expert.bio}
        </p>
        <div className='mt-auto flex flex-col gap-2 pt-2'>
          <ExpertTagList
            tags={expert.tags}
            limit={4}
            tagClassName='rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600'
          />
          <PreviewCta variant='main' />
        </div>
      </div>
    </SelectableCard>
  );

  const shell = (
    <div className='relative h-full min-h-0 w-full'>
      {body}
      <FixedUnfixBar selected={selected} fixedSlot={fixedSlot} onUnfix={onUnfix} />
      <CardActions onRemove={onRemove} />
    </div>
  );

  if (draggable && cell.kind === 'managed' && managedIndex != null) {
    return (
      <DraggableManagedCard
        itemId={cell.item.id}
        managedIndex={managedIndex}
        name={expert.name}
        className='relative h-full min-h-0 w-full'
      >
        {shell}
      </DraggableManagedCard>
    );
  }

  return shell;
}

function MiddleCard({
  cell,
  expert,
  selected,
  managedIndex,
  draggable,
  fixedSlot,
  onSelect,
  onUnfix,
  onAvatarUpload,
  avatarUploading,
  onRemove
}: CardCommonProps) {
  if (cell.kind === 'empty' || !expert) {
    return (
      <div className='text-muted-foreground flex h-full min-h-[120px] w-full items-center justify-center rounded-xl border border-dashed text-xs'>
        中间大卡空位 · 拖动专家到此处
      </div>
    );
  }

  const body = (
    <SelectableCard
      onSelect={onSelect}
      className={`relative flex h-full w-full cursor-pointer flex-col items-center overflow-hidden rounded-xl border bg-gradient-to-b from-slate-900 to-[#3b0a0a] px-3 pt-5 pb-3 text-white shadow-lg transition-all ${cardShellClass(selected)} ${draggable ? 'pl-8' : ''}`}
    >
      <ClickableAvatar
        src={expert.avatarUrl}
        alt={expert.name}
        className='mb-2 h-16 w-16 rounded-full border-4 border-primary/30 md:h-[72px] md:w-[72px]'
        size={72}
        resourceId={expert.resourceId}
        uploading={avatarUploading}
        onUpload={onAvatarUpload}
      />
      <h4 className='text-sm font-bold tracking-wide md:text-base'>{expert.name}</h4>
      <p className='mt-1.5 line-clamp-3 text-center text-[10px] leading-relaxed text-white/80 md:text-[11px]'>
        {expert.bio}
      </p>
      <ExpertTagList
        tags={expert.tags}
        limit={3}
        className='mt-2 justify-center'
        tagClassName='rounded border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-white/90'
      />
      <PreviewCta variant='middle' />
    </SelectableCard>
  );

  const shell = (
    <div className='relative h-full min-h-0 w-full'>
      {body}
      <FixedUnfixBar selected={selected} fixedSlot={fixedSlot} onUnfix={onUnfix} />
      <CardActions onRemove={onRemove} />
    </div>
  );

  if (draggable && cell.kind === 'managed' && managedIndex != null) {
    return (
      <DraggableManagedCard
        itemId={cell.item.id}
        managedIndex={managedIndex}
        name={expert.name}
        className='relative h-full min-h-0 w-full'
      >
        {shell}
      </DraggableManagedCard>
    );
  }

  return shell;
}

function SideCard({
  expert,
  selected,
  managedIndex,
  itemId,
  draggable,
  onSelect,
  onAvatarUpload,
  avatarUploading,
  onRemove
}: {
  expert: PreviewExpertView;
  selected: boolean;
  managedIndex: number;
  itemId: number;
  draggable: boolean;
  onSelect: () => void;
  onAvatarUpload?: (resourceId: number, file: File) => void;
  avatarUploading?: boolean;
  onRemove: () => void;
}) {
  const body = (
    <>
      <SelectableCard
        onSelect={onSelect}
        className='flex min-h-0 flex-1 cursor-pointer flex-col pl-6 text-left'
      >
        <div className='mb-2 flex items-start gap-3'>
          <ClickableAvatar
            src={expert.avatarUrl}
            alt={expert.name}
            className='h-14 w-14 rounded-full border border-slate-100'
            size={56}
            resourceId={expert.resourceId}
            uploading={avatarUploading}
            onUpload={onAvatarUpload}
          />
          <div className='min-w-0 flex-1'>
            <h4 className='truncate text-sm font-bold text-slate-800'>{expert.name}</h4>
            {expert.positionTitle ? (
              <p className='text-muted-foreground mt-0.5 line-clamp-1 text-[11px]'>
                {expert.positionTitle}
              </p>
            ) : null}
          </div>
        </div>
        {expert.bio ? (
          <p className='text-muted-foreground line-clamp-2 text-[11px] leading-relaxed'>{expert.bio}</p>
        ) : null}
        <ExpertTagList
          tags={expert.tags}
          limit={3}
          className='mt-auto gap-1.5 pt-2'
          tagClassName='rounded bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600'
        />
      </SelectableCard>
      <span className='text-primary absolute right-4 bottom-4'>
        <Icons.arrowRight className='h-4 w-4' />
      </span>
      <CardActions onRemove={onRemove} />
    </>
  );

  const shellClass = `relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-white p-3 text-left shadow-sm transition-all ${cardShellClass(selected)}`;

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
    <div className='text-muted-foreground flex h-full min-h-0 flex-1 items-center justify-center rounded-xl border border-dashed p-3 text-center text-xs'>
      {hint}
    </div>
  );
}
