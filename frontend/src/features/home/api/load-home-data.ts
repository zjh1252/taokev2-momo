import { getCourseList } from '@/features/course/api/service';
import type { CourseListItem } from '@/features/course/api/types';
import {
  formatPlanStartDate,
  normalizeCourseDurationDays
} from '@/features/course/utils/display';
import { getPublicRecommendations, getPublicRecommendationSlotConfig } from '@/features/recommendation/api/service';
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
import { toPlainIntroText } from '@/features/trainer/utils/displayTitle';
import { resolveImageSrc, resolveApiImageSrc } from '@/lib/media';
import { featuredCases, featuredExperts } from '../data/mock';
import { HOME_BANNER_DEFAULTS } from '../constants/banner-defaults';
import type { CaseStudy, Expert, HomeBanner, InternalCourse, PublicCourse } from '../types';

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

import { dedupeTags, parseDelimitedTags } from '@/lib/tags';

function parseTags(
  expertiseCategories?: { categoryName: string }[],
  expertiseTags?: string
): string[] {
  if (expertiseCategories?.length) {
    return dedupeTags(expertiseCategories.map((c) => c.categoryName).filter(Boolean));
  }
  return parseDelimitedTags(expertiseTags);
}

function formatCaseDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const FALLBACK_HOME_BANNERS: HomeBanner[] = HOME_BANNER_DEFAULTS.map((item) => ({
  id: `fallback-${item.position}`,
  imageUrl: item.coverUrl,
  consultButtonImageUrl: item.consultButtonImageUrl,
  topicButtonImageUrl: item.topicButtonImageUrl,
  topicButtonLinkUrl: item.topicButtonLinkUrl
}));

export async function loadHomeBanners(): Promise<HomeBanner[]> {
  try {
    const items = await getPublicRecommendations(RecommendationSlotCode.HOME_BANNER, { limit: 3 });
    const banners = items
      .filter((item) => item.coverUrl || item.resourceCoverUrl)
      .slice(0, 3)
      .map((item, index) => {
        const fallback = HOME_BANNER_DEFAULTS[index] ?? HOME_BANNER_DEFAULTS[0];
        return {
          id: `${item.resourceId}-${index}`,
          imageUrl: resolveApiImageSrc(
            item.coverUrl || item.resourceCoverUrl || fallback.coverUrl
          ),
          consultButtonImageUrl: resolveApiImageSrc(
            item.consultButtonImageUrl || fallback.consultButtonImageUrl
          ),
          topicButtonImageUrl: resolveApiImageSrc(
            item.topicButtonImageUrl || fallback.topicButtonImageUrl
          ),
          topicButtonLinkUrl:
            item.topicButtonLinkUrl?.trim() || fallback.topicButtonLinkUrl
        };
      });
    return banners.length > 0 ? banners : FALLBACK_HOME_BANNERS;
  } catch {
    return FALLBACK_HOME_BANNERS;
  }
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
    title: toPlainIntroText(trainer.title || ''),
    avatar: resolveApiImageSrc(trainer.avatar),
    coverImage: resolveApiImageSrc(detail?.backgroundImage || trainer.avatar),
    bio: toPlainIntroText(detail?.intro || detail?.bio || trainer.oneLineIntro || ''),
    subtitle: toPlainIntroText(trainer.oneLineIntro || ''),
    tags,
    badge: index === 0 ? '首席专家' : undefined
  };
}

async function mapTrainersToExperts(trainers: TrainerListItem[]): Promise<Expert[]> {
  if (trainers.length === 0) return [];
  return trainers.map((t, index) => mapTrainerListItemToExpert(t, index, null));
}

/** 运营位优先，不足时用推荐池与公开列表补齐至目标数量 */
/** 运营位/mock 专家用详情接口补齐真实头像（有自定义用自定义，无则用素材库默认） */
async function enrichExpertsFromApi(experts: Expert[]): Promise<Expert[]> {
  return Promise.all(
    experts.map(async (expert) => {
      if (!expert.id) return expert;

      const needsDetail =
        !expert.avatar?.trim() ||
        !expert.coverImage?.trim() ||
        !expert.bio?.trim();

      if (!needsDetail) {
        return {
          ...expert,
          avatar: resolveApiImageSrc(expert.avatar),
          coverImage: resolveApiImageSrc(expert.coverImage || expert.avatar)
        };
      }

      try {
        const detail = await getTrainerDetail(expert.id);
        const avatarRaw = detail.avatar?.trim();
        const coverRaw = detail.backgroundImage?.trim() || avatarRaw;
        return {
          ...expert,
          name: detail.teachingName || detail.name || expert.name,
          title: toPlainIntroText(detail.title || expert.title),
          avatar: avatarRaw ? resolveApiImageSrc(avatarRaw) : resolveApiImageSrc(expert.avatar),
          coverImage: coverRaw
            ? resolveApiImageSrc(coverRaw)
            : resolveApiImageSrc(expert.coverImage || expert.avatar),
          bio: toPlainIntroText(detail.intro || detail.bio || expert.bio),
          subtitle: toPlainIntroText(detail.oneLineIntro || expert.subtitle)
        };
      } catch {
        return {
          ...expert,
          avatar: resolveApiImageSrc(expert.avatar),
          coverImage: resolveApiImageSrc(expert.coverImage || expert.avatar)
        };
      }
    })
  );
}

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
    const [slotItems, slotConfig] = await Promise.all([
      getPublicRecommendations(RecommendationSlotCode.HOME_TRAINER, {
        limit: HOME_EXPERT_TARGET
      }),
      getPublicRecommendationSlotConfig(RecommendationSlotCode.HOME_TRAINER).catch(() => ({
        slotCode: RecommendationSlotCode.HOME_TRAINER,
        lockMain: true,
        lockMiddle: true
      }))
    ]);
    const fromSlot = mapSlotTrainersToExperts(slotItems);
    const fixedMain = featuredExperts[0];
    const fixedMiddle = featuredExperts[1];
    const composed: Expert[] = [];
    let slotIdx = 0;

    if (slotConfig.lockMain) composed.push(fixedMain);
    else if (fromSlot[slotIdx]) composed.push(fromSlot[slotIdx++]);

    if (slotConfig.lockMiddle) composed.push(fixedMiddle);
    else if (fromSlot[slotIdx]) composed.push(fromSlot[slotIdx++]);

    while (composed.length < HOME_EXPERT_TARGET && fromSlot[slotIdx]) {
      composed.push(fromSlot[slotIdx++]);
    }

    if (composed.length >= HOME_EXPERT_TARGET) {
      return enrichExpertsFromApi(composed.slice(0, HOME_EXPERT_TARGET));
    }
    const filled = await fillHomeExperts(composed, HOME_EXPERT_TARGET);
    if (filled.length > 0) return enrichExpertsFromApi(filled);
    return enrichExpertsFromApi(featuredExperts);
  } catch {
    try {
      const fixedMain = featuredExperts[0];
      const fixedMiddle = featuredExperts[1];
      const filled = await fillHomeExperts([fixedMain, fixedMiddle], HOME_EXPERT_TARGET);
      if (filled.length > 0) return enrichExpertsFromApi(filled);
      return enrichExpertsFromApi(featuredExperts);
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
    image: resolveImageSrc(c.coverImage),
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
  const page = await getCourseList({ isOpen: false, page: 1, size: 36, sortBy: 'default' });
  const list = page?.list ?? [];
  if (list.length === 0) return [];

  return pickHomeInternalCourses(list, 6).map((c) => ({
    id: c.id,
    title: c.title,
    subtitle: c.categoryName || '',
    coverUrl: resolveApiImageSrc(c.coverUrl?.trim()) || undefined,
    instructorName: c.trainerName || '-',
    instructorAvatar: '',
    instructorDesc: c.keywords || c.categoryName || ''
  }));
}

export async function loadHomeInternalCourses(): Promise<InternalCourse[]> {
  try {
    const slotItems = await getPublicRecommendations(RecommendationSlotCode.HOME_INNER_COURSE, { limit: 6 });
    // 与公开课一致：运营位有数据即用，避免因不足 6 条回退慢列表（size=36 ≈1.5s）
    if (slotItems.length > 0) {
      return mapSlotCoursesToInternalCourses(slotItems);
    }
    return await loadHomeInternalCoursesLegacy();
  } catch {
    try {
      return await loadHomeInternalCoursesLegacy();
    } catch {
      return [];
    }
  }
}

async function loadHomePublicCoursesLegacy(): Promise<PublicCourse[]> {
  const page = await getCourseList({
    isOpen: true,
    page: 1,
    size: 30,
    sortBy: 'time'
  });
  const list = page?.list ?? [];
  const courses = pickHomeOpenCourses(list, 3);
  if (courses.length === 0) return [];

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    coverUrl: resolveApiImageSrc(c.coverUrl?.trim()) || undefined,
    organizer: c.publisherName || '-',
    instructor: c.trainerName || '-',
    city: c.nextPlanCity?.trim() || '-',
    startDate: formatPlanStartDate(c.nextPlanStartDate),
    durationDays: normalizeCourseDurationDays(c.durationDays, c.totalHours),
    categoryName: c.categoryName || undefined,
    keywords: c.keywords?.trim() || undefined
  }));
}

export async function loadHomePublicCourses(): Promise<PublicCourse[]> {
  try {
    const slotItems = await getPublicRecommendations(RecommendationSlotCode.HOME_OPEN_COURSE, {
      limit: 3
    });
    if (slotItems.length > 0) {
      return mapSlotCoursesToPublicCourses(slotItems, (value) =>
        formatPlanStartDate(value ?? undefined)
      );
    }
    return await loadHomePublicCoursesLegacy();
  } catch {
    try {
      return await loadHomePublicCoursesLegacy();
    } catch {
      return [];
    }
  }
}
