/** C 端推荐位 — 类型定义（对齐后端 PublicRecommendedItemVO） */

export const RecommendationSlotCode = {
  HOME_TRAINER: 'HOME_TRAINER',
  TRAINER_LIST_TRAINER: 'TRAINER_LIST_TRAINER',
  TRAINER_CATEGORY_EXPERT: 'TRAINER_CATEGORY_EXPERT',
  HOME_INNER_COURSE: 'HOME_INNER_COURSE',
  HOME_OPEN_COURSE: 'HOME_OPEN_COURSE',
  HOME_CASE: 'HOME_CASE',
  TRAINER_PAGE_CASE: 'TRAINER_PAGE_CASE',
  INSTITUTION_GOLD: 'INSTITUTION_GOLD'
} as const;

export type RecommendationSlotCode =
  (typeof RecommendationSlotCode)[keyof typeof RecommendationSlotCode];

export interface PublicRecommendedItem {
  resourceId: number;
  resourceType: 'TRAINER' | 'COURSE' | 'CASE' | 'INSTITUTION';
  roleType?: string;
  sortOrder?: number;
  coverUrl?: string | null;
  title?: string | null;
  description?: string | null;
  expertiseOverride?: string | null;
  keyTags?: string | null;
  resourceName?: string | null;
  resourceCoverUrl?: string | null;
  resourceDescription?: string | null;
  resourceMeta?: string | null;
  teachingName?: string | null;
  trainerTitle?: string | null;
  oneLineIntro?: string | null;
  expertiseTags?: string | null;
  avatar?: string | null;
  courseType?: string | null;
  courseSummary?: string | null;
  trainerName?: string | null;
  nextPlanStartDate?: string | null;
  nextPlanCity?: string | null;
  durationDays?: number | null;
  publisherName?: string | null;
  trainerId?: number | null;
  caseTitle?: string | null;
  industry?: string | null;
  trainingDate?: string | null;
  trainerNameForCase?: string | null;
  trainerAvatar?: string | null;
  orgName?: string | null;
  logoUrl?: string | null;
}

export interface GetPublicRecommendationsOptions {
  limit?: number;
  categoryId?: number;
  includeBackup?: boolean;
}
