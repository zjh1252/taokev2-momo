import http from '@/utils/request';

/** 下级行政区划（parentCode 空/0 为省级） */
export const getRegionChildren = (parentCode) =>
  http.get('/regions/children', parentCode ? { parentCode } : {});
