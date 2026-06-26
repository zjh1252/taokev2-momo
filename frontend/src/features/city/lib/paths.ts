import type { CityChannelDetail } from '../api/types';

/** SEO 城市频道首页：/city/{拼音} */
export function cityChannelPath(enName: string): string {
  return `/city/${enName}`;
}

/** 城市公开课列表：/city/{拼音}/opencourse */
export function cityOpenCourseListPath(enName: string): string {
  return `/city/${enName}/opencourse`;
}

/** 城市机构列表：/city/{拼音}/institutions */
export function cityInstitutionListPath(enName: string): string {
  return `/city/${enName}/institutions`;
}

/** 城市专家列表：/city/{拼音}/trainers */
export function cityTrainerListPath(enName: string): string {
  return `/city/${enName}/trainers`;
}

/** 带 query 的公开课列表（兼容旧链） */
export function openCourseListWithCity(detail: Pick<CityChannelDetail, 'cityRegionId' | 'cityName'>): string {
  return `/opencourse?cityIds=${detail.cityRegionId}&cityName=${encodeURIComponent(detail.cityName)}`;
}
