import http from '@/utils/request';

/** C 端运营推荐位（HOME_TRAINER / HOME_CASE / HOME_OPEN_COURSE 等） */
export const getPublicRecommendations = (slotCode, params = {}, options = {}) =>
  http.get('/recommendations/public', { slotCode, ...params }, options);
