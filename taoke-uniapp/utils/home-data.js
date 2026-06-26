import * as expertApi from '@/api/expert';

import * as courseApi from '@/api/course';

import * as recoApi from '@/api/recommendation';

import {

  mapSlotToCourse,

  mapSlotToCase,

  mapSlotToExpert,

  normalizeCase,

  normalizeExpert,

  normalizeHomePublicCourse,

  normalizeOpenCourseListItem,

} from '@/utils/normalize';



export async function loadHomeExperts(limit = 6) {

  try {

    const slot = await recoApi.getPublicRecommendations('HOME_TRAINER', { limit }, { silent: true });

    if (Array.isArray(slot) && slot.length) {

      return slot.map(mapSlotToExpert).filter((e) => e && e.id);

    }

  } catch (_) { /* 静默 */ }



  try {

    const list = await expertApi.listRecommendedTrainers(limit);

    if (Array.isArray(list) && list.length) return list.map(normalizeExpert).filter(Boolean);

  } catch (_) { /* 静默 */ }



  try {

    const page = await expertApi.listTrainers({ page: 1, size: limit, sort: 'default' });

    const records = (page && (page.records || page.content || page.list)) || [];

    if (records.length) return records.map(normalizeExpert).filter(Boolean);

  } catch (_) { /* 静默 */ }



  return [];

}



export async function loadHomeCases(limit = 4) {

  try {

    const slot = await recoApi.getPublicRecommendations('HOME_CASE', { limit }, { silent: true });

    if (Array.isArray(slot) && slot.length) {

      return slot.map(mapSlotToCase).filter((c) => c && c.id);

    }

  } catch (_) { /* 静默 */ }



  try {

    const cases = await expertApi.listRecentCases({ limit });

    const list = Array.isArray(cases) ? cases : [];

    if (list.length) return list.map(normalizeCase).filter(Boolean);

  } catch (_) { /* 静默 */ }



  return [];

}



/** @deprecated 请用 loadHomeCases */

export async function loadHomeLatestCase() {

  const cases = await loadHomeCases(1);

  if (!cases.length) return '';

  const c = cases[0];

  const title = c.title || c.caseTitle || '企业培训案例';

  const trainer = c.trainerName ? `${c.trainerName} · ` : '';

  return `${trainer}${title}`;

}



export async function loadHomePublicCourses(limit = 3) {

  try {

    const slot = await recoApi.getPublicRecommendations('HOME_OPEN_COURSE', { limit }, { silent: true });

    if (Array.isArray(slot) && slot.length) {

      const mapped = slot.map(mapSlotToCourse).filter((c) => c && c.id);

      return enrichHomePublicCoursesFromApi(mapped);

    }

  } catch (_) { /* 静默 */ }



  try {

    const hot = await courseApi.getHotOpenCourses();

    if (Array.isArray(hot) && hot.length) {

      return hot.slice(0, limit).map(normalizeHomePublicCourse).filter(Boolean);

    }

  } catch (_) { /* 静默 */ }



  try {

    const page = await courseApi.listOpenCourses({ page: 1, size: limit * 2, sortBy: 'time' });

    const records = (page && (page.records || page.content || page.list)) || [];

    if (records.length) {

      return records.map(normalizeHomePublicCourse).filter(Boolean).slice(0, limit);

    }

  } catch (_) { /* 静默 */ }



  return [];

}



/** 用公开课列表 API 补全运营位缺失的讲师/排期等字段 */

async function enrichHomePublicCoursesFromApi(courses) {

  if (!courses.length) return courses;

  try {

    const page = await courseApi.listOpenCourses({ page: 1, size: 50, sortBy: 'time' });

    const records = (page && (page.records || page.content || page.list)) || [];

    const byId = new Map();

    for (const r of records) {

      const id = r.id || r.courseId;

      if (id) byId.set(id, r);

    }

    return courses.map((c) => {

      const raw = byId.get(c.id);

      if (!raw) return c;

      const enriched = normalizeHomePublicCourse(raw);

      return enriched ? { ...c, ...enriched, id: c.id } : c;

    });

  } catch (_) {

    return courses;

  }

}



/** 公开课列表页数据 */

export { normalizeOpenCourseListItem };

