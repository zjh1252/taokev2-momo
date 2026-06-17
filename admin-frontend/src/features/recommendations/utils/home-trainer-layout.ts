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

/** 描述 = 运营覆盖的一句话简介，否则专家档案一句话简介 */
export function resolveOneLineIntro(item: RecommendedResourceItem): string {
  return (item.description ?? item.resourceDescription ?? '').trim();
}

export function resolvePositionTitle(item: RecommendedResourceItem): string {
  return (item.title ?? '').trim();
}

export function resolveChiefIntro(item: RecommendedResourceItem): string {
  return (item.chiefIntro ?? '').trim();
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
