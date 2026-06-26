import http from '@/utils/request';

/**
 * 专家分页列表
 * @param {Object} params - 后端 PublicTrainerQuery：
 *   keyword / expertiseCategoryId / industryCategoryId / provinceId / cityId
 *   isTrusted / sort / page / size
 */
export const listTrainers = (params) => http.get('/trainers', params);

/** 推荐专家 */
export const listRecommendedTrainers = (limit = 10) =>
  http.get('/trainers/recommended', { limit });

/** 同领域推荐专家（详情页底部） */
export const listSameExpertiseTrainers = (id) =>
  http.get(`/trainers/${id}/recommended-trainers`);

/**
 * 专家详情（公开主页）
 */
export const getTrainerDetail = (id) => http.get(`/trainers/${id}`);

/** 专家授课案例 */
export const listTrainerCases = (id) => http.get(`/trainers/${id}/cases`);

/** 专家精彩片段 */
export const listTrainerHighlights = (id) => http.get(`/trainers/${id}/highlights`);

/** 专家课程列表 */
export const listTrainerCourses = (id, params) =>
  http.get(`/trainers/${id}/courses`, params);

/** 专家最近案例（首页推荐用） */
export const listRecentCases = (params) =>
  http.get('/trainer-cases/recent', params);

/**
 * 机构（暂代「专家列表」数据源；后端如有专门的 /trainers 公开列表接口可替换）
 */
export const listInstitutions = (params) => http.get('/institutions', params);

/** 机构详情 */
export const getInstitutionDetail = (id) => http.get(`/institutions/${id}`);
