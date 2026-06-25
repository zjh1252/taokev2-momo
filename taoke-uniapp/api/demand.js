import http from '@/utils/request';

/** 我的需求列表 GET /demands/mine */
export const listMyDemands = (params) => http.get('/demands/mine', params);

/** 需求详情 GET /demands/{id} */
export const getDemandDetail = (id) => http.get(`/demands/${id}`);

/** 取消需求 PUT /demands/{id}/cancel */
export const cancelDemand = (id) => http.put(`/demands/${id}/cancel`);
