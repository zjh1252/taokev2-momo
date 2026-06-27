/** 内训课 embed URL 工具（基于通用 pxb-course-list-url） */
import { PXB_INTERNAL_COURSE_CONFIG } from './config/pxb-course-list-config';
import {
  type PxbCourseListUrlState,
  DEFAULT_PXB_COURSE_LIST_STATE,
  parsePxbCourseListUrl,
  buildPxbCourseListSearchParams,
  replacePxbCourseListUrl,
  pxbCourseListParams,
} from './pxb-course-list-url';

export type PxbInternalCourseUrlState = PxbCourseListUrlState;
export const DEFAULT_INTERNAL_STATE = DEFAULT_PXB_COURSE_LIST_STATE;

export function parsePxbInternalCourseUrl(searchParams: URLSearchParams) {
  return parsePxbCourseListUrl(searchParams);
}

export function buildPxbInternalCourseSearchParams(state: PxbInternalCourseUrlState) {
  return buildPxbCourseListSearchParams(state, PXB_INTERNAL_COURSE_CONFIG);
}

export function replacePxbInternalCourseUrl(state: PxbInternalCourseUrlState) {
  replacePxbCourseListUrl(state, PXB_INTERNAL_COURSE_CONFIG);
}

export function pxbInternalCourseListParams(state: PxbInternalCourseUrlState) {
  return pxbCourseListParams(state, PXB_INTERNAL_COURSE_CONFIG);
}
