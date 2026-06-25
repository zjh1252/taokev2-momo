import { resolveAssetUrl } from '@/lib/resolve-asset-url';
import type { RecommendedResourceItem } from '../api/types';
import {
  HOME_TRAINER_FIXED_EXPERTS,
  type HomeTrainerFixedSlot
} from '../constants/home-trainer-fixed';

export const HOME_TRAINER_TOTAL_SLOTS = 4;
export const DEFAULT_TRAINER_AVATAR = '/statics/images/avatar-placeholder.svg';

export type HomeTrainerFixedLocks = {
  main: boolean;
  middle: boolean;
};

export const DEFAULT_HOME_TRAINER_LOCKS: HomeTrainerFixedLocks = {
  main: true,
  middle: true
};

export type HomeTrainerSelection =
  | { kind: 'fixed'; slot: HomeTrainerFixedSlot }
  | { kind: 'managed'; id: number };

export type HomeTrainerSlotCell =
  | { kind: 'fixed'; slot: HomeTrainerFixedSlot; layout: 'main' | 'middle' }
  | { kind: 'managed'; item: RecommendedResourceItem; layout: 'main' | 'middle' | 'side' }
  | { kind: 'empty'; layout: 'main' | 'middle' | 'side' };

export type HomeTrainerLayout = {
  main: HomeTrainerSlotCell;
  middle: HomeTrainerSlotCell;
  sides: [HomeTrainerSlotCell, HomeTrainerSlotCell];
  managedItems: RecommendedResourceItem[];
};

export function countManagedSlots(locks: HomeTrainerFixedLocks): number {
  return (
    HOME_TRAINER_TOTAL_SLOTS - (locks.main ? 1 : 0) - (locks.middle ? 1 : 0)
  );
}

export function buildHomeTrainerLayout(
  locks: HomeTrainerFixedLocks,
  items: RecommendedResourceItem[]
): HomeTrainerLayout {
  const managedCap = countManagedSlots(locks);
  const managedItems = items.slice(0, managedCap);
  let idx = 0;
  const take = () => managedItems[idx++];

  const main: HomeTrainerSlotCell = locks.main
    ? { kind: 'fixed', slot: 'main', layout: 'main' }
    : managedItems[idx]
      ? { kind: 'managed', item: take()!, layout: 'main' }
      : { kind: 'empty', layout: 'main' };

  const middle: HomeTrainerSlotCell = locks.middle
    ? { kind: 'fixed', slot: 'middle', layout: 'middle' }
    : managedItems[idx]
      ? { kind: 'managed', item: take()!, layout: 'middle' }
      : { kind: 'empty', layout: 'middle' };

  const sides: [HomeTrainerSlotCell, HomeTrainerSlotCell] = [
    managedItems[idx]
      ? { kind: 'managed', item: take()!, layout: 'side' }
      : { kind: 'empty', layout: 'side' },
    managedItems[idx]
      ? { kind: 'managed', item: take()!, layout: 'side' }
      : { kind: 'empty', layout: 'side' }
  ];

  return { main, middle, sides, managedItems };
}

export function parseTags(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[,，、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 专家头像：优先原始头像，空则占位图 */
export function resolveTrainerAvatarUrl(
  item?: Pick<RecommendedResourceItem, 'resourceCoverUrl' | 'coverUrl'> | null
): string {
  const raw = item?.resourceCoverUrl?.trim() || item?.coverUrl?.trim() || '';
  const resolved = raw ? resolveAssetUrl(raw) : '';
  return resolved || resolveAssetUrl(DEFAULT_TRAINER_AVATAR);
}

/** 推荐封面：运营封面优先 */
export function resolveTrainerCoverUrl(
  item?: Pick<RecommendedResourceItem, 'resourceCoverUrl' | 'coverUrl'> | null
): string {
  const raw = item?.coverUrl?.trim() || item?.resourceCoverUrl?.trim() || '';
  const resolved = raw ? resolveAssetUrl(raw) : '';
  return resolved || resolveAssetUrl(DEFAULT_TRAINER_AVATAR);
}

/** 去除 HTML 标签，供预览卡片纯文本展示 */
function toPlainIntroText(text?: string | null): string {
  if (!text?.trim()) return '';
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-zA-Z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 描述 = 运营覆盖的一句话简介，否则专家档案一句话简介 */
export function resolveOneLineIntro(item: RecommendedResourceItem): string {
  return toPlainIntroText(item.description ?? item.resourceDescription ?? '');
}

export function resolvePositionTitle(item: RecommendedResourceItem): string {
  return toPlainIntroText(item.title ?? '');
}

export function resolveChiefIntro(item: RecommendedResourceItem): string {
  return toPlainIntroText(item.chiefIntro ?? '');
}

export type PreviewExpertView = {
  key: string;
  name: string;
  positionTitle: string;
  oneLineIntro: string;
  chiefIntro: string;
  badge?: string;
  avatarUrl: string;
  coverUrl: string;
  tags: string[];
  isFixed?: boolean;
};

export function mapFixedToPreview(slot: HomeTrainerFixedSlot): PreviewExpertView {
  const expert = HOME_TRAINER_FIXED_EXPERTS[slot];
  return {
    key: `fixed-${slot}`,
    name: expert.name,
    positionTitle: expert.title,
    oneLineIntro: expert.subtitle || expert.bio,
    chiefIntro: expert.chiefIntro,
    badge: expert.badge,
    avatarUrl: resolveAssetUrl(expert.avatar) || resolveAssetUrl(DEFAULT_TRAINER_AVATAR),
    coverUrl: resolveAssetUrl(expert.coverImage) || resolveAssetUrl(DEFAULT_TRAINER_AVATAR),
    tags: parseTags(expert.keyTags),
    isFixed: true
  };
}

export function mapManagedToPreview(
  item: RecommendedResourceItem,
  layout: 'main' | 'middle' | 'side'
): PreviewExpertView {
  const tags = parseTags(item.keyTags || item.expertiseOverride);
  const oneLineIntro = resolveOneLineIntro(item);
  return {
    key: `managed-${item.id}`,
    name: item.resourceName ?? `#${item.resourceId}`,
    positionTitle: resolvePositionTitle(item),
    oneLineIntro,
    chiefIntro: resolveChiefIntro(item),
    badge: layout === 'main' ? '首席专家' : undefined,
    avatarUrl: resolveTrainerAvatarUrl(item),
    coverUrl: resolveTrainerCoverUrl(item),
    tags,
    isFixed: false
  };
}

export function cellToSelection(cell: HomeTrainerSlotCell): HomeTrainerSelection | null {
  if (cell.kind === 'fixed') return { kind: 'fixed', slot: cell.slot };
  if (cell.kind === 'managed') return { kind: 'managed', id: cell.item.id };
  return null;
}

export function isSelectionMatch(
  selection: HomeTrainerSelection | null,
  target: HomeTrainerSelection
): boolean {
  if (!selection) return false;
  if (selection.kind !== target.kind) return false;
  if (selection.kind === 'fixed' && target.kind === 'fixed') {
    return selection.slot === target.slot;
  }
  if (selection.kind === 'managed' && target.kind === 'managed') {
    return selection.id === target.id;
  }
  return false;
}

export function formatListedAt(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export type HomeTrainerPreviewSlot = {
  key: 'main' | 'middle' | 'side-0' | 'side-1';
  cell: HomeTrainerSlotCell;
  /** managedItems 中的目标序号；fixed 格为 null */
  managedIndex: number | null;
  droppable: boolean;
  draggable: boolean;
};

/** 四卡预览格与 managedItems 下标的对应关系（用于拖拽排序/投放） */
export function enumeratePreviewSlots(layout: HomeTrainerLayout): HomeTrainerPreviewSlot[] {
  let pendingIndex = 0;

  const walk = (key: HomeTrainerPreviewSlot['key'], cell: HomeTrainerSlotCell): HomeTrainerPreviewSlot => {
    if (cell.kind === 'fixed') {
      return { key, cell, managedIndex: null, droppable: false, draggable: false };
    }
    if (cell.kind === 'managed') {
      const managedIndex = layout.managedItems.findIndex((item) => item.id === cell.item.id);
      pendingIndex = Math.max(pendingIndex, managedIndex + 1);
      return { key, cell, managedIndex, droppable: true, draggable: true };
    }
    const managedIndex = pendingIndex;
    pendingIndex += 1;
    return { key, cell, managedIndex, droppable: true, draggable: false };
  };

  return [
    walk('main', layout.main),
    walk('middle', layout.middle),
    walk('side-0', layout.sides[0]),
    walk('side-1', layout.sides[1])
  ];
}

export function reorderManagedIds(
  items: RecommendedResourceItem[],
  fromIndex: number,
  toIndex: number
): number[] {
  const orderedIds = items.map((item) => item.id);
  if (fromIndex < 0 || fromIndex >= orderedIds.length) return orderedIds;
  if (toIndex < 0 || toIndex > orderedIds.length) return orderedIds;
  if (fromIndex === toIndex) return orderedIds;
  const [moved] = orderedIds.splice(fromIndex, 1);
  orderedIds.splice(Math.min(toIndex, orderedIds.length), 0, moved);
  return orderedIds;
}
