import http from '@/utils/request';

/** 评价列表 */
export const listReviews = (params) => http.get('/interaction/reviews', params);

/** 我的评价 */
export const listMyReviews = (params) => http.get('/interaction/reviews/mine', params);

/** 提交评价 */
export const submitReview = (data) => http.post('/interaction/reviews', data);

/** 收藏 */
export const addFavorite = (data) => http.post('/interaction/favorites', data);

export const removeFavorite = (params) =>
  http.del('/interaction/favorites', params);

export const listFavorites = (params) =>
  http.get('/interaction/favorites', params);

export const checkFavorite = (params) =>
  http.get('/interaction/favorites/check', params);

/** 点赞 */
export const addLike = (data) => http.post('/interaction/likes', data);
export const removeLike = (params) => http.del('/interaction/likes', params);
export const checkLike = (params) => http.get('/interaction/likes/check', params);

/** 互动状态合并查询（详情页一次拿收藏/点赞/已购） */
export const getInteractionStates = (params) =>
  http.get('/interaction/states', params);
