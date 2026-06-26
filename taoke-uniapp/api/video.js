import http from '@/utils/request';

/** 录播课详情 */
export const getVideoDetail = (id) => http.get(`/videos/${id}`);

/** 访问权限（需登录） */
export const getVideoAccess = (id) => http.get(`/videos/${id}/access`, {}, { silent: true });

/** 学习进度 */
export const getVideoProgress = (videoId) =>
  http.get(`/videos/${videoId}/progress`, {}, { silent: true });

/** 上报章节播放进度 */
export const updateVideoProgress = (videoId, data) =>
  http.post(`/videos/${videoId}/progress`, data, { silent: true });

/** 签发章节播放地址 */
export const getChapterPlaybackUrl = (videoId, chapterId) =>
  http.get(`/videos/${videoId}/chapters/${chapterId}/playback-url`, {}, { silent: true });
