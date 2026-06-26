/** @deprecated 请使用 pxb-course-list-url；保留兼容公开课 embed 引用 */
import { PXB_OPEN_COURSE_CONFIG } from './config/pxb-course-list-config';
import {
  type PxbCourseListUrlState,
  DEFAULT_PXB_COURSE_LIST_STATE,
  parsePxbCourseListUrl,
  buildPxbCourseListSearchParams,
  replacePxbCourseListUrl,
  pxbCourseListParams,
} from './pxb-course-list-url';

export type PxbOpenCourseUrlState = PxbCourseListUrlState;
export const DEFAULT_STATE = DEFAULT_PXB_COURSE_LIST_STATE;

export function parsePxbOpenCourseUrl(searchParams: URLSearchParams) {
  return parsePxbCourseListUrl(searchParams);
}

export function buildPxbOpenCourseSearchParams(state: PxbOpenCourseUrlState) {
  return buildPxbCourseListSearchParams(state, PXB_OPEN_COURSE_CONFIG);
}

export function replacePxbOpenCourseUrl(state: PxbOpenCourseUrlState) {
  replacePxbCourseListUrl(state, PXB_OPEN_COURSE_CONFIG);
}

export function pxbOpenCourseListParams(state: PxbOpenCourseUrlState) {
  return pxbCourseListParams(state, PXB_OPEN_COURSE_CONFIG);
}
