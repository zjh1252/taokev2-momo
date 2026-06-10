/** 专家详情 Tab 在地址栏中的路径段（.htm 前） */
export const TRAINER_TAB_SLUGS = {
  courses: 'courses',
  cases: 'cases',
  videos: 'video',
  comments: 'comment',
  books: 'book',
} as const;

export type TrainerTabId = 'home' | keyof typeof TRAINER_TAB_SLUGS;

export type TrainerTabSlug = (typeof TRAINER_TAB_SLUGS)[keyof typeof TRAINER_TAB_SLUGS];

/** slug → tabId 映射，含旧版单数形式以兼容旧 URL */
const SLUG_TO_TAB: Record<string, Exclude<TrainerTabId, 'home'>> = {
  courses: 'courses',
  course: 'courses', // 旧版单数，兼容
  cases: 'cases',
  case: 'cases', // 旧版单数，兼容
  video: 'videos',
  comment: 'comments',
  book: 'books',
};

const TAB_QUERY_ALIASES: Record<string, TrainerTabId> = {
  home: 'home',
  courses: 'courses',
  course: 'courses',
  cases: 'cases',
  case: 'cases',
  videos: 'videos',
  video: 'videos',
  comments: 'comments',
  comment: 'comments',
  books: 'books',
  book: 'books',
};

export function isTrainerTabSlug(value: string): value is TrainerTabSlug {
  return value in SLUG_TO_TAB;
}

export function trainerTabSlugToId(slug: TrainerTabSlug): Exclude<TrainerTabId, 'home'> {
  return SLUG_TO_TAB[slug];
}

export function trainerTabQueryToId(tab: string | null | undefined): TrainerTabId | null {
  if (!tab) return null;
  return TAB_QUERY_ALIASES[tab] ?? null;
}

/** 专家详情页各 Tab 的 SEO 地址（浏览器地址栏） */
export function getTrainerDetailTabHref(trainerId: number, tab: TrainerTabId = 'home'): string {
  if (tab === 'home') {
    return `/trainer/${trainerId}.htm`;
  }
  return `/trainer/${trainerId}/${TRAINER_TAB_SLUGS[tab]}.htm`;
}
