import type { CourseListItem } from '@/features/course/api/types';
import type { Expert, CaseStudy, InternalCourse, PublicCourse } from '@/features/home/types';
import type { InstitutionListItem } from '@/features/institution/types';
import type { RecentTrainerCase } from '@/features/trainer/api/service';
import type { TrainerListItem } from '@/features/trainer/types';
import { isPresentableRecommendedTrainer } from '@/features/trainer/utils/recommended';
import { resolveApiImageSrc, resolveImageSrc } from '@/lib/media';
import type { PublicRecommendedItem } from './types';

function parseTagList(value?: string | null): string[] {
  if (!value) return [];
  return value
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

export function mapSlotTrainerToListItem(item: PublicRecommendedItem): TrainerListItem {
  const displayName = item.teachingName || item.resourceName || '';
  const avatar = resolveApiImageSrc(item.avatar || item.resourceCoverUrl || '');
  const intro = item.description || item.oneLineIntro || item.resourceDescription || '';
  return {
    id: item.resourceId,
    name: displayName,
    teachingName: displayName,
    avatar,
    title: item.title || item.trainerTitle || '',
    oneLineIntro: intro,
    score: 0,
    isRecommended: 1,
    isTrusted: 0,
    commentCount: 0,
    viewCount: 0,
    provinceId: 0,
    cityId: 0,
    expertiseTags: item.expertiseTags || item.expertiseOverride || item.resourceMeta || '',
    expertiseCategories: parseTagList(item.expertiseTags || item.expertiseOverride).map((name, index) => ({
      id: 0,
      categoryId: 0,
      sortOrder: index,
      categoryName: name
    }))
  };
}

export function mapSlotTrainersToListItems(items: PublicRecommendedItem[]): TrainerListItem[] {
  return items.map(mapSlotTrainerToListItem).filter(isPresentableRecommendedTrainer);
}

export function mapSlotTrainersToExperts(items: PublicRecommendedItem[]): Expert[] {
  return items.map((item, index) => {
    const displayName = item.teachingName || item.resourceName || '';
    const avatarRaw = item.avatar || item.resourceCoverUrl || '';
    const avatar = avatarRaw.trim() ? resolveApiImageSrc(avatarRaw) : '';
    const coverRaw = item.coverUrl?.trim() || '';
    const cover = coverRaw ? resolveApiImageSrc(coverRaw) : avatar;
    const tags = parseTagList(item.expertiseTags || item.expertiseOverride || item.keyTags);
    const oneLineIntro = (item.description ?? item.oneLineIntro ?? item.resourceDescription ?? '').trim();
    const chiefIntro = (item.chiefIntro ?? '').trim();
    const positionTitle = (item.title ?? item.trainerTitle ?? '').trim();
    return {
      id: item.resourceId,
      name: displayName,
      title: positionTitle,
      avatar,
      coverImage: cover,
      bio: chiefIntro || oneLineIntro,
      subtitle: oneLineIntro,
      tags,
      badge: index === 0 ? '首席专家' : undefined
    };
  });
}

export function mapSlotCasesToCaseStudies(items: PublicRecommendedItem[]): CaseStudy[] {
  return items.map((item) => ({
    id: item.resourceId,
    tag: item.industry || item.resourceMeta || '企业培训',
    title: item.caseTitle || item.resourceName || '',
    description: (item.description || item.resourceDescription || '').slice(0, 32),
    image: resolveImageSrc(item.coverUrl || item.resourceCoverUrl),
    tags: item.industry ? [item.industry] : parseTagList(item.keyTags),
    caseDate: formatCaseDate(item.trainingDate),
    trainerName: item.trainerNameForCase || undefined
  }));
}

export function mapSlotCasesToRecentCases(items: PublicRecommendedItem[]): RecentTrainerCase[] {
  return items.map((item) => ({
    id: item.resourceId,
    trainerId: item.trainerId ?? 0,
    trainerUserId: 0,
    trainerName: item.trainerNameForCase || '',
    trainerAvatar: item.trainerAvatar || null,
    caseTitle: item.caseTitle || item.resourceName || '',
    coverImage: item.coverUrl || item.resourceCoverUrl || null,
    industry: item.industry || item.resourceMeta || null,
    description: item.description || item.resourceDescription || null,
    trainingDate: item.trainingDate || null
  }));
}

export function mapSlotCourseToListItem(item: PublicRecommendedItem): CourseListItem {
  const type = (item.courseType === 'OPEN_OFFLINE' || item.courseType === 'OPEN_ONLINE'
    ? item.courseType
    : 'INTERNAL') as CourseListItem['type'];
  return {
    id: item.resourceId,
    title: item.resourceName || '',
    type,
    typeLabel: type === 'INTERNAL' ? '内训课' : '公开课',
    coverUrl: item.coverUrl || item.resourceCoverUrl || '',
    categoryId: 0,
    categoryName: item.resourceMeta || '',
    durationDays: item.durationDays ?? 0,
    totalHours: 0,
    price: 0,
    originalPrice: 0,
    isFeatured: 0,
    isFree: 0,
    status: 2,
    statusLabel: '已上架',
    viewCount: 0,
    enrollmentCount: 0,
    score: 0,
    publisherType: '',
    publisherName: item.publisherName || '',
    trainerName: item.trainerName || '',
    keywords: item.keyTags || item.courseSummary || '',
    publishedAt: '',
    createdAt: '',
    nextPlanStartDate: item.nextPlanStartDate || undefined,
    nextPlanCity: item.nextPlanCity || undefined
  };
}

export function mapSlotCoursesToInternalCourses(items: PublicRecommendedItem[]): InternalCourse[] {
  return items.map((item) => {
    const course = mapSlotCourseToListItem(item);
    return {
      id: course.id,
      title: course.title,
      subtitle: course.categoryName || '',
      coverUrl: resolveApiImageSrc(course.coverUrl?.trim()) || undefined,
      instructorName: course.trainerName || '-',
      instructorAvatar: '',
      instructorDesc: course.keywords || course.categoryName || ''
    };
  });
}

export function mapSlotCoursesToPublicCourses(
  items: PublicRecommendedItem[],
  formatStartDate: (value?: string | null) => string
): PublicCourse[] {
  return items.map((item) => {
    const course = mapSlotCourseToListItem(item);
    const rawCover = (course.coverUrl || '').trim();
    return {
      id: course.id,
      title: course.title,
      coverUrl: rawCover ? resolveApiImageSrc(rawCover) : undefined,
      organizer: course.publisherName || '-',
      instructor: course.trainerName || '-',
      city: course.nextPlanCity?.trim() || '-',
      startDate: formatStartDate(course.nextPlanStartDate),
      durationDays: course.durationDays ?? null
    };
  });
}

export function mapSlotInstitutionsToListItems(items: PublicRecommendedItem[]): InstitutionListItem[] {
  return items.map((item) => ({
    id: item.resourceId,
    orgName: item.orgName || item.resourceName || '',
    logoUrl: item.logoUrl || item.resourceCoverUrl || undefined,
    bio: item.description || item.resourceDescription || undefined,
    specialties: item.expertiseOverride || item.resourceMeta || undefined,
    provinceId: 0,
    cityId: 0,
    score: 0,
    viewCount: 0,
    commentCount: 0,
    openCourseCount: 0,
    innerCourseCount: 0,
    isCertified: 0,
    isRecommended: 1
  }));
}
