import http from '@/utils/request';

/**
 * 公开课列表
 * @param {Object} query - 后端 PublicCourseQuery：keyword/categoryId/cityCode/page/size 等
 */
export const listCourses = (query) => http.get('/courses', query);

/** 课程详情 */
export const getCourseDetail = (id) => http.get(`/courses/${id}`);

/** 推荐课程（按讲师） */
export const getRecommendedByTrainer = (trainerId) =>
  http.get(`/trainers/${trainerId}/recommended-courses`);

/** 热门公开课（首页用） */
export const getHotOpenCourses = () => http.get('/opencourses/hot');

/** 视频列表 */
export const listVideos = (query) => http.get('/videos', query);

/** 视频详情 */
export const getVideoDetail = (id) => http.get(`/videos/${id}`);

/** 视频分类树（公开课页 8 宫格） */
export const getVideoCategories = () => http.get('/videos/categories');
