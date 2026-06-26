import type { RecommendationManagerConfig } from '../api/types';

export const TRAINER_RECOMMENDATION_CONFIG: RecommendationManagerConfig = {
  resourceType: 'TRAINER',
  defaultSlotCode: 'HOME_TRAINER',
  pageTitle: '推荐专家',
  candidateLabel: '专家列表',
  detailPathTemplate: '/dashboard/trainers/{id}'
};

export const COURSE_RECOMMENDATION_CONFIG: RecommendationManagerConfig = {
  resourceType: 'COURSE',
  defaultSlotCode: 'HOME_INNER_COURSE',
  pageTitle: '推荐课程',
  candidateLabel: '课程列表',
  detailPathTemplate: '/dashboard/courses/{id}'
};

export const CASE_RECOMMENDATION_CONFIG: RecommendationManagerConfig = {
  resourceType: 'CASE',
  defaultSlotCode: 'HOME_CASE',
  pageTitle: '推荐管理',
  candidateLabel: '案例列表',
  detailPathTemplate: '/dashboard/trainers/cases/{id}'
};

export const INSTITUTION_RECOMMENDATION_CONFIG: RecommendationManagerConfig = {
  resourceType: 'INSTITUTION',
  defaultSlotCode: 'INSTITUTION_GOLD',
  pageTitle: '推荐机构',
  candidateLabel: '机构列表',
  detailPathTemplate: '/dashboard/institutions'
};
