import { getCourseList } from '@/features/course/api/service';
import type { CourseListItem } from '@/features/course/api/types';
import {
  formatPlanStartDate,
  normalizeCourseDurationDays
} from '@/features/course/utils/display';
import { getPublicRecommendations } from '@/features/recommendation/api/service';
import {
  mapSlotCasesToCaseStudies,
  mapSlotCoursesToInternalCourses,
  mapSlotCoursesToPublicCourses,
  mapSlotTrainersToExperts
} from '@/features/recommendation/api/mappers';
import { RecommendationSlotCode } from '@/features/recommendation/api/types';
import {
  getRecentTrainerCases,
  getTopRecommendedTrainers,
  getTrainerDetail,
  getTrainerList
} from '@/features/trainer/api/service';
import type { TrainerListItem } from '@/features/trainer/types';
import { isPresentableRecommendedTrainer } from '@/features/trainer/utils/recommended';
import { DEFAULT_COURSE_COVER, resolveImageSrc } from '@/lib/media';
import {
  featuredCases,
  featuredExperts,
  popularInternalCourses,
  upcomingPublicCourses
} from '../data/mock';
import type { CaseStudy, Expert, InternalCourse, PublicCourse } from '../types';

/** 无封面时的轮换占位图（与 mock 资源路径一致） */
const COURSE_FALLBACK_COVERS = [
  '/statics/images/course-1.jpg',
  '/statics/images/case-1.jpg',
  '/statics/images/public-course-1.jpg',
  '/statics/images/hero-banner.jpg',
  '/statics/images/case-2.jpg',
  DEFAULT_COURSE_COVER
];

/** 优先选取封面 URL 不重复的课程，避免首页多张卡片显示同一张图 */
function pickHomeInternalCourses(list: CourseListItem[], count = 6): CourseListItem[] {
  const picked: CourseListItem[] = [];
  const seenCovers = new Set<string>();
  const usedIds = new Set<number>();

  const tryPick = (c: CourseListItem, dedupeCover: boolean) => {
    if (usedIds.has(c.id)) return;
    const cover = c.coverUrl?.trim();
    if (dedupeCover && cover && seenCovers.has(cover)) return;
    if (cover) seenCovers.add(cover);
    picked.push(c);
    usedIds.add(c.id);
  };

  for (const c of list) {
    if (picked.length >= count) break;
    if (c.coverUrl?.trim()) tryPick(c, true);
  }
  for (const c of list) {
    if (picked.length >= count) break;
    if (!c.coverUrl?.trim()) tryPick(c, false);
  }
  for (const c of list) {
    if (picked.length >= count) break;
    tryPick(c, false);
  }

  return picked.slice(0, count);
}

function courseFallbackCover(courseId: number): string {
  return COURSE_FALLBACK_COVERS[Math.abs(courseId) % COURSE_FALLBACK_COVERS.length];
}

/** 首页线下公开课：优先线下课、有排期、封面不重复 */
function pickHomeOpenCourses(list: CourseListItem[], count = 3): CourseListItem[] {
  const sorted = [...list].sort((a, b) => {
    const aOffline = a.type === 'OPEN_OFFLINE' ? 1 : 0;
    const bOffline = b.type === 'OPEN_OFFLINE' ? 1 : 0;
    if (bOffline !== aOffline) return bOffline - aOffline;
    const aPlan = a.nextPlanStartDate ? 1 : 0;
    const bPlan = b.nextPlanStartDate ? 1 : 0;
    return bPlan - aPlan;
  });

  const picked: CourseListItem[] = [];
  const seenCovers = new Set<string>();
  const usedIds = new Set<number>();

  const tryPick = (c: CourseListItem, dedupeCover: boolean) => {
    if (usedIds.has(c.id)) return;
    const cover = c.coverUrl?.trim();
    if (dedupeCover && cover && seenCovers.has(cover)) return;
    if (cover) seenCovers.add(cover);
    picked.push(c);
    usedIds.add(c.id);
  };

  for (const c of sorted) {
    if (picked.length >= count) break;
    if (c.coverUrl?.trim() && c.nextPlanStartDate) tryPick(c, true);
  }
  for (const c of sorted) {
    if (picked.length >= count) break;
    if (c.nextPlanStartDate) tryPick(c, true);
  }
  for (const c of sorted) {
    if (picked.length >= count) break;
    tryPick(c, false);
  }

  return picked.slice(0, count);
}

function parseTags(
  expertiseCategories?: { categoryName: string }[],
  expertiseTags?: string
): string[] {
  if (expertiseCategories?.length) {
    return expertiseCategories.map((c) => c.categoryName).filter(Boolean);
  }
  if (!expertiseTags) return [];
  return expertiseTags
    .split(/[,，、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatCaseDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const HOME_EXPERT_TARGET = 4;

function mapTrainerListItemToExpert(
  trainer: TrainerListItem,
  index: number,
  detail?: Awaited<ReturnType<typeof getTrainerDetail>> | null
): Expert {
  const tags = parseTags(trainer.expertiseCategories, trainer.expertiseTags);
  return {
    id: trainer.id,
    name: trainer.teachingName || trainer.name,
    title: trainer.title || '',
    avatar: resolveImageSrc(trainer.avatar),
    coverImage: resolveImageSrc(detail?.backgroundImage || trainer.avatar),
    bio: detail?.intro || detail?.bio || trainer.oneLineIntro || '',
    subtitle: trainer.oneLineIntro || '',
    tags,
    badge: index === 0 ? '首席专家' : undefined
  };
}

async function mapTrainersToExperts(trainers: TrainerListItem[]): Promise<Expert[]> {
  if (trainers.length === 0) return [];

  const details = await Promise.all(
    trainers.slice(0, 2).map((t) => getTrainerDetail(t.id).catch(() => null))
  );

  return trainers.map((t, index) => mapTrainerListItemToExpert(t, index, index < 2 ? details[index] : null));
}

/** 运营位优先，不足时用推荐池与公开列表补齐至目标数量 */
async function fillHomeExperts(primary: Expert[], target = HOME_EXPERT_TARGET): Promise<Expert[]> {
  const merged: Expert[] = [...primary];
  const seen = new Set(merged.map((e) => e.id));

  const appendFromTrainers = async (trainers: TrainerListItem[]) => {
    const candidates = trainers.filter(isPresentableRecommendedTrainer);
    if (candidates.length === 0) return;

    const need = target - merged.length;
    const fresh = candidates.filter((t) => !seen.has(t.id)).slice(0, need);
    if (fresh.length === 0) return;

    const mapped = await mapTrainersToExperts(fresh);
    for (const expert of mapped) {
      if (merged.length >= target) break;
      if (seen.has(expert.id)) continue;
      seen.add(expert.id);
      merged.push({
        ...expert,
        badge: merged.length === 0 ? expert.badge ?? '首席专家' : undefined
      });
    }
  };

  if (merged.length < target) {
    await appendFromTrainers(await getTopRecommendedTrainers(target * 3).catch(() => []));
  }

  if (merged.length < target) {
    const { list } = await getTrainerList({ page: 1, size: target * 3, sort: 'default' }).catch(() => ({
      list: [] as TrainerListItem[]
    }));
    await appendFromTrainers(list);
  }

  return merged.slice(0, target);
}

export async function loadHomeExperts(): Promise<Expert[]> {
  try {
    const slotItems = await getPublicRecommendations(RecommendationSlotCode.HOME_TRAINER, {
      limit: HOME_EXPERT_TARGET
    });
    const fromSlot = mapSlotTrainersToExperts(slotItems);
    const filled = await fillHomeExperts(fromSlot);
    if (filled.length > 0) return filled;
    return featuredExperts;
  } catch {
    try {
      const filled = await fillHomeExperts([]);
      if (filled.length > 0) return filled;
      return featuredExperts;
    } catch {
      return featuredExperts;
    }
  }
}

async function loadHomeCasesLegacy(): Promise<CaseStudy[]> {
  const cases = await getRecentTrainerCases(4);
  if (cases.length === 0) return featuredCases;

  return cases.map((c) => ({
    id: c.id,
    tag: c.industry || '企业培训',
    title: c.caseTitle,
    description: (c.description || '').slice(0, 32),
    image: resolveImageSrc(c.coverImage || DEFAULT_COURSE_COVER, DEFAULT_COURSE_COVER),
    tags: c.industry ? [c.industry] : [],
    caseDate: formatCaseDate(c.trainingDate),
    trainerName: c.trainerName
  }));
}

export async function loadHomeCases(): Promise<CaseStudy[]> {
  try {
    const slotItems = await getPublicRecommendations(RecommendationSlotCode.HOME_CASE, { limit: 4 });
    if (slotItems.length >= 4) {
      return mapSlotCasesToCaseStudies(slotItems);
    }
    return await loadHomeCasesLegacy();
  } catch {
    try {
      return await loadHomeCasesLegacy();
    } catch {
      return featuredCases;
    }
  }
}

async function loadHomeInternalCoursesLegacy(): Promise<InternalCourse[]> {
  const { list } = await getCourseList({ isOpen: false, page: 1, size: 36, sortBy: 'default' });
  if (list.length === 0) return popularInternalCourses;

  return pickHomeInternalCourses(list, 6).map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.categoryName || '',
    coverUrl: c.coverUrl?.trim() || undefined,
    image: courseFallbackCover(c.id),
    instructorName: c.trainerName || '-',
    instructorAvatar: '',
    instructorDesc: c.keywords || c.categoryName || ''
  }));
}

export async function loadHomeInternalCourses(): Promise<InternalCourse[]> {
  try {
    const slotItems = await getPublicRecommendations(RecommendationSlotCode.HOME_INNER_COURSE, { limit: 6 });
    if (slotItems.length >= 6) {
      return mapSlotCoursesToInternalCourses(slotItems);
    }
    return await loadHomeInternalCoursesLegacy();
  } catch {
    try {
      return await loadHomeInternalCoursesLegacy();
    } catch {
      return popularInternalCourses;
    }
  }
}

async function loadHomePublicCoursesLegacy(): Promise<PublicCourse[]> {
  const { list } = await getCourseList({
    isOpen: true,
    page: 1,
    size: 30,
    sortBy: 'time'
  });
  const courses = pickHomeOpenCourses(list, 3);
  if (courses.length === 0) return upcomingPublicCourses;

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    coverUrl: c.coverUrl?.trim() || undefined,
    image: courseFallbackCover(c.id),
    organizer: c.publisherName || '-',
    instructor: c.trainerName || '-',
    city: c.nextPlanCity?.trim() || '-',
    startDate: formatPlanStartDate(c.nextPlanStartDate),
    durationDays: normalizeCourseDurationDays(c.durationDays, c.totalHours)
  }));
}

export async function loadHomePublicCourses(): Promise<PublicCourse[]> {
  try {
    const slotItems = await getPublicRecommendations(RecommendationSlotCode.HOME_OPEN_COURSE, { limit: 3 });
    if (slotItems.length >= 3) {
      return mapSlotCoursesToPublicCourses(slotItems, (value) =>
        formatPlanStartDate(value ?? undefined)
      );
    }
    return await loadHomePublicCoursesLegacy();
  } catch {
    try {
      return await loadHomePublicCoursesLegacy();
    } catch {
      return upcomingPublicCourses;
    }
  }
}
