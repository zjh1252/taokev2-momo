import http from '@/utils/request';

export const CourseStatus = {
  DRAFT: 0,
  PENDING: 1,
  PUBLISHED: 2,
  REJECTED: 3,
  UNPUBLISHED: 4,
};

export const CourseStatusLabel = {
  0: '草稿',
  1: '待审核',
  2: '已上架',
  3: '已驳回',
  4: '已下架',
};

export const getMyCourses = (params = {}) => http.get('/courses/me', params);

export const getMyCourseDetail = (id) => http.get(`/courses/me/${id}`);

export const createCourse = (data, trainerUserId, enterpriseAgentUserId) => {
  const params = {};
  if (trainerUserId) params.trainerUserId = trainerUserId;
  else if (enterpriseAgentUserId) params.enterpriseAgentUserId = enterpriseAgentUserId;
  return http.post('/courses', data, { params });
};

export const updateCourse = (id, data) => http.put(`/courses/${id}`, data);

export const submitCourse = (id) => http.put(`/courses/${id}/submit`);

export const unpublishCourse = (id) => http.put(`/courses/${id}/unpublish`);

export const deleteCourse = (id) => http.del(`/courses/${id}`);
