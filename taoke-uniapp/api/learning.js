import http from '@/utils/request';

const silent = { silent: true };

/** 继续学习（最近未完成录播课） */
export const getContinueLearning = () => http.get('/learning/continue', {}, silent);

/** 我的录播课学习记录 */
export const getMyVideoLearnings = (page = 1, size = 10) =>
  http.get('/learning/videos', { page, size }, silent);

/** 我的公开课报名记录 */
export const getMyCourseEnrollments = (page = 1, size = 10) =>
  http.get('/learning/courses', { page, size }, silent);
