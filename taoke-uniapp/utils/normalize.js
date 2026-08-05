/**

 * 后端 VO → 小程序卡片组件数据契约

 */



import {

  formatPlanStartDate,

  normalizeCourseDurationDays,

  formatCaseDate,

  pickResourceDisplayTitle,
  isLikelyUrl,
} from '@/utils/course-display';



export function normalizeExpert(item) {

  if (!item) return null;

  const tags =

    (Array.isArray(item.expertiseCategories) &&

      item.expertiseCategories.map((c) => c.categoryName).filter(Boolean)) ||

    (typeof item.expertiseTags === 'string' && item.expertiseTags

      ? item.expertiseTags.split(/[、,，\s]+/).filter(Boolean)

      : []) ||

    (typeof item.keyTags === 'string' && item.keyTags

      ? item.keyTags.split(/[、,，\s]+/).filter(Boolean)

      : []);



  return {

    id: item.id || item.resourceId || item.trainerId,

    nickname: item.teachingName || item.name || item.nickname || item.resourceName,

    avatar: item.avatar || item.resourceCoverUrl || item.coverUrl,

    title: item.trainerTitle || item.title || item.oneLineIntro || item.chiefIntro,

    rating: Number(item.score || item.rating || 0),

    verified: !!(item.isTrusted === 1 || item.isTrusted === true),

    tags,

    viewCount: item.viewCount || 0,

    favCount: item.commentCount || item.favCount || 0,

  };

}



/** 公开课列表项 — 对齐 PC CourseListItem / OpenCourseCard */

export function normalizeOpenCourseListItem(v) {

  if (!v) return null;

  const nextPlanStartDate = v.nextPlanStartDate || v.startDate || v.startTime || '';

  const nextPlanCity = (v.nextPlanCity || v.cityName || v.city || v.location || '').trim();

  return {

    id: v.id || v.courseId || v.resourceId,

    title: pickResourceDisplayTitle(v) || (v.resourceName && !isLikelyUrl(v.resourceName) ? v.resourceName : '') || v.name || '',

    categoryName: v.categoryName || v.resourceMeta || '',

    trainerName: v.trainerName || v.lecturerName || v.teacherName || '',

    publisherName: v.publisherName || '',

    keywords: v.keywords || v.keyTags || v.courseSummary || '',

    nextPlanStartDate,

    nextPlanCity,

    durationDays: v.durationDays,

    totalHours: v.totalHours,

    score: Number(v.score || 0),

    viewCount: v.viewCount || 0,

    isFeatured: v.isFeatured === 1 || v.isFeatured === true ? 1 : 0,

    price: v.price ?? v.salePrice ?? '',

    coverUrl: v.coverUrl || v.cover || v.resourceCoverUrl || v.thumbnail || '',

    planTime: formatPlanStartDate(nextPlanStartDate),

    planCity: nextPlanCity || '-',

    durationDaysDisplay: normalizeCourseDurationDays(v.durationDays, v.totalHours),

  };

}



/** 首页推荐公开课 — 对齐 PC PublicCourse */

export function normalizeHomePublicCourse(v) {

  const base = normalizeOpenCourseListItem(v);

  if (!base) return null;

  return {

    id: base.id,

    title: base.title,

    coverUrl: v.coverUrl || v.cover || v.resourceCoverUrl || v.thumbnail || '',

    organizer: base.publisherName || '-',

    instructor: base.trainerName || '-',

    city: base.planCity,

    startDate: base.planTime,

    durationDays: base.durationDaysDisplay,

  };

}



/** 授课案例 — 对齐 PC CaseStudy */

export function normalizeCase(c) {

  if (!c) return null;

  const industry = c.industry || c.resourceMeta || '';

  const tags =

    (Array.isArray(c.tags) && c.tags.length && c.tags) ||

    (industry ? [industry] : []);

  const desc = (c.description || c.resourceDescription || '').replace(/<[^>]+>/g, '').trim();

  return {

    id: c.id || c.resourceId,

    tag: c.tag || industry || '企业培训',

    title: c.caseTitle || c.title || c.resourceName || '',

    caseTitle: c.caseTitle || c.title || c.resourceName || '',

    description: desc.slice(0, 64),

    image: c.coverImage || c.coverUrl || c.resourceCoverUrl || '',

    coverImage: c.coverImage || c.coverUrl || c.resourceCoverUrl || '',

    tags,

    industry,

    enterpriseName: c.enterpriseName || '',

    caseDate: formatCaseDate(c.trainingDate || c.caseDate),

    trainerName: c.trainerName || c.trainerNameForCase || '',

  };

}



/** @deprecated 列表页请用 normalizeOpenCourseListItem */

export function normalizeCourse(v) {

  const item = normalizeOpenCourseListItem(v);

  if (!item) return null;

  return {

    id: item.id,

    title: item.title,

    coverUrl: v.coverUrl || v.cover || v.resourceCoverUrl || v.thumbnail,

    startDate: item.planTime,

    city: item.planCity,

    trainerName: item.trainerName,

    price: item.price,

  };

}



export function mapSlotToExpert(item) {

  return normalizeExpert({

    id: item.resourceId,

    teachingName: item.teachingName || item.resourceName || item.title,

    avatar: item.avatar || item.resourceCoverUrl || item.coverUrl,

    trainerTitle: item.trainerTitle || item.oneLineIntro || item.chiefIntro,

    expertiseTags: item.expertiseTags || item.expertiseOverride || item.keyTags,

    score: 5,

    isTrusted: 1,

  });

}



export function mapSlotToCourse(item) {

  return normalizeHomePublicCourse({

    id: item.resourceId,

    resourceName: item.resourceName,

    title: pickResourceDisplayTitle(item),

    coverUrl: item.coverUrl || item.resourceCoverUrl,

    publisherName: item.publisherName,

    trainerName: item.trainerName,

    nextPlanStartDate: item.nextPlanStartDate,

    nextPlanCity: item.nextPlanCity,

    durationDays: item.durationDays,

    totalHours: item.totalHours,

  });

}



export function mapSlotToCase(item) {

  return normalizeCase({

    id: item.resourceId,

    caseTitle: item.caseTitle || item.resourceName,

    description: item.description || item.resourceDescription,

    coverImage: item.coverUrl || item.resourceCoverUrl,

    industry: item.industry || item.resourceMeta,

    trainingDate: item.trainingDate,

    trainerNameForCase: item.trainerNameForCase,

    tag: item.industry || item.resourceMeta || '企业培训',

  });

}



/** 分类树只取一级节点（专家「类别」筛选用） */

export function flattenTopCategories(tree) {

  if (!Array.isArray(tree) || !tree.length) return [];

  const hasNested = tree.some((n) => Array.isArray(n.children) && n.children.length > 0);

  if (hasNested) {

    return tree

      .map((n) => ({

        id: n.id,

        name: n.name || n.categoryName || '',

      }))

      .filter((n) => n.id && n.name);

  }

  return tree

    .filter((n) => n.id && (n.name || n.categoryName) && (n.parentId == null || n.parentId === 0))

    .map((n) => ({

      id: n.id,

      name: n.name || n.categoryName || '',

    }))

    .filter((n) => n.id && n.name);

}



/** 分类树扁平化（含子级，用于筛选 picker） */
export function flattenCategoryOptions(tree) {
  const result = [];
  function walk(nodes, prefix) {
    if (!Array.isArray(nodes)) return;
    for (const n of nodes) {
      const name = n.name || n.categoryName || '';
      if (n.id && name) {
        const label = prefix ? `${prefix} / ${name}` : name;
        result.push({ id: n.id, name: label });
      }
      if (Array.isArray(n.children) && n.children.length) {
        walk(n.children, prefix ? `${prefix} / ${name}` : name);
      }
    }
  }
  walk(tree, '');
  return result;
}

/** 分类树扁平化 — 仅叶子节点，名称不带父级前缀（专家筛选等场景） */
export function flattenLeafCategories(tree) {
  const result = [];
  function walk(nodes) {
    if (!Array.isArray(nodes)) return;
    for (const n of nodes) {
      const name = n.name || n.categoryName || '';
      const children = Array.isArray(n.children) ? n.children.filter(Boolean) : [];
      if (children.length) {
        walk(children);
      } else if (n.id && name) {
        result.push({ id: n.id, name });
      }
    }
  }
  walk(tree);
  return result;
}

