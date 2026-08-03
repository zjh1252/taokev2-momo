import type { TrainerCase } from '@/features/trainer-case/api/types';
import type { CourseDetail, CoursePlan } from '@/features/course/api/types';
import type { InstitutionDetail } from '@/features/institution/types';
import type { TrainerDetail } from '@/features/trainer/types';
import type { VideoDetail } from '@/features/video/api/types';
import { getTrainerDisplayName } from '@/features/trainer/utils/displayName';
import {
  joinFilterPrefix,
  joinKeywords,
  parseFieldLabel,
  stripHtml,
  toMetadata,
  truncateDescription,
  type SeoFields,
} from './helpers';

export type FilterContext = {
  city?: string;
  industry?: string;
  /** 专家列表 field slug 原始值 */
  field?: string;
  /** 课程/机构/录播分类名 */
  category?: string;
};

// ─── 首页 ───────────────────────────────────────────────

export function buildHomeMetadata(): SeoFields {
  return {
    title: '淘课网-领先的企业培训采购平台',
    description:
      '淘课网是一站式企业培训采购平台，汇聚2万+实战讲师、海量内训/公开课、企业培训案例，覆盖人力、营销、生产、领导力等全领域，快速匹配适配您的企业培训方案。',
    keywords: joinKeywords(
      '企业培训',
      '企业培训采购',
      '企业内训',
      '公开课',
      '培训机构',
      '企业培训平台',
    ),
  };
}

// ─── 专家列表 ───────────────────────────────────────────

export function buildTrainerListMetadata(filter?: FilterContext): SeoFields {
  const prefix = joinFilterPrefix(filter ?? {});
  const fieldLabel = parseFieldLabel(filter?.field) ?? filter?.category;

  if (prefix || fieldLabel) {
    const label = prefix || fieldLabel || '';
    return {
      title: `${label}培训师_淘课网`,
      description: `汇集${label}众多的培训发展老师，主讲的培训发展类课程包括培训发展，内部培训师，培训管理，培训评估、培训需求分析、培训计划制定等`,
      keywords: joinKeywords('培训师', filter?.city, filter?.industry, fieldLabel, '专家', '讲师'),
    };
  }

  return {
    title: '培训师,培训讲师,专家-淘课网',
    description:
      '淘课网有注册培训师1万多名，为培训师免费提供信息发布、培训课程发布等服务，签约培训讲师和专家还可享受培训需求速递、内训需求推荐、培训课程重点推广等服务。',
    keywords: joinKeywords(
      '企业培训讲师',
      '培训讲师',
      '企业内训讲师',
      '培训专家',
      '讲师推荐',
      '专家库',
    ),
  };
}

// ─── 专家详情 ───────────────────────────────────────────

export function buildTrainerDetailMetadata(trainer: TrainerDetail): SeoFields {
  const name = getTrainerDisplayName(trainer);
  const positioning = trainer.oneLineIntro?.trim() || trainer.title?.trim() || '培训专家';

  const expertiseNames = trainer.expertiseCategories?.map((c) => c.categoryName) ?? [];
  const industryNames = trainer.industryCategories?.map((c) => c.categoryName) ?? [];

  const descParts = [trainer.goodAt, trainer.title || trainer.oneLineIntro]
    .map((s) => s?.trim())
    .filter(Boolean);

  return {
    title: `${name}_${positioning}_淘课网`,
    description:
      descParts.length > 0
        ? `${name}，${positioning}，擅长${descParts.join('、')}，可提供企业管理线下内训、高管专题培训与定制化课程服务。`
        : `${name}，${positioning}，淘课网认证企业培训讲师，可为企业提供内训课程、公开课授课与培训需求匹配服务。`,
    keywords: joinKeywords(...expertiseNames, ...industryNames),
  };
}

// ─── 公开课列表 ─────────────────────────────────────────

export function buildOpenCourseListMetadata(filter?: FilterContext): SeoFields {
  const prefix = joinFilterPrefix(filter ?? {});
  const fieldLabel = filter?.category ?? parseFieldLabel(filter?.field);

  if (prefix || fieldLabel) {
    const label = prefix || fieldLabel || '';
    return {
      title: `${label}公开课_淘课网`,
      description: `淘课网${label}公开课培训列表，汇集淘课网上最新的${label}公开课和${fieldLabel ?? label}培训课程，欢迎来咨询和采购。`,
      keywords: joinKeywords(
        '公开课',
        filter?.city,
        filter?.industry,
        fieldLabel,
        '企业公开课',
        '企业培训课程',
      ),
    };
  }

  return {
    title: '公开课,培训课程-淘课网',
    description:
      '公开课、企业培训课程，面向企业培训采购方，涵盖领导力、营销、管理等多种培训领域，支持按城市与分类筛选在线报名。',
    keywords: joinKeywords('公开课', '企业公开课', '培训课程', '企业培训课程'),
  };
}

// ─── 公开课详情 ─────────────────────────────────────────

function formatPlanMeta(plan?: CoursePlan): string {
  if (!plan) return '';
  const location = plan.cityName || plan.provinceName || plan.address || '';
  const time = plan.startTime ? plan.startTime.slice(0, 10) : '';
  return [location, time].filter(Boolean).join('，');
}

export function buildOpenCourseDetailMetadata(
  course: CourseDetail,
  planIndex = 0,
): SeoFields {
  const plans = course.plans ?? [];
  const plan = plans[planIndex] ?? plans[0];
  const planMeta = formatPlanMeta(plan);
  const titleSuffix = planMeta ? `_${planMeta}` : '';

  const descParts = [
    course.summary || stripHtml(course.intro).slice(0, 60),
    planMeta,
    course.audience,
  ]
    .map((s) => s?.trim())
    .filter(Boolean);

  return {
    title: `${course.title}${titleSuffix}_公开课_淘课网`,
    description:
      descParts.length > 0
        ? `《${course.title}》公开课面向企业培训与管理提升场景，涵盖${descParts.join('、')}，支持查看开课安排、费用与报名咨询。`
        : `《${course.title}》公开课提供企业培训主题内容、开课计划、费用与报名信息，帮助企业培训负责人快速评估课程适配度。`,
    keywords: joinKeywords(course.title, course.categoryName, '公开课', '企业培训课程'),
  };
}

// ─── 内训课列表 ─────────────────────────────────────────

export function buildInnerCourseListMetadata(filter?: FilterContext): SeoFields {
  const prefix = joinFilterPrefix(filter ?? {});
  const fieldLabel = filter?.category ?? parseFieldLabel(filter?.field);

  if (prefix || fieldLabel) {
    const label = prefix || fieldLabel || '';
    return {
      title: `${label}内训课_淘课网`,
      description: `淘课网${label}内训课培训列表，汇集淘课网上最新的${label}内训课和${fieldLabel ?? label}培训课程，欢迎来咨询和采购。`,
      keywords: joinKeywords(
        '内训课',
        filter?.city,
        filter?.industry,
        fieldLabel,
        '企业内训课',
        '企业培训课程',
      ),
    };
  }

  return {
    title: '内训课程,企业内训-淘课网',
    description:
      '汇聚上万名颇具实战经验的培训师，曾为中国移动、阿里巴巴等300家知名企业量身定制了满意率高达98%的企业内训课程，从内训需求诊断，到方案的制定和实施，受到高度赞誉。',
    keywords: joinKeywords('企业内训', '内训课程', '企业培训方案'),
  };
}

// ─── 内训课详情 ─────────────────────────────────────────

export function buildInnerCourseDetailMetadata(course: CourseDetail): SeoFields {
  const descParts = [
    course.summary || stripHtml(course.intro).slice(0, 60),
    course.audience,
  ]
    .map((s) => s?.trim())
    .filter(Boolean);

  return {
    title: `${course.title}_内训课_淘课网`,
    description:
      descParts.length > 0
        ? `《${course.title}》企业内训课围绕${descParts.join('、')}，适合企业按团队现状定制培训方案并匹配实战讲师。`
        : `《${course.title}》企业内训课提供课程介绍、适用对象与讲师信息，帮助企业按培训目标定制落地方案。`,
    keywords: joinKeywords(course.title, course.categoryName, '企业内训', '内训课程'),
  };
}

// ─── 录播课列表 ─────────────────────────────────────────

export function buildVideoListMetadata(filter?: FilterContext): SeoFields {
  const category = filter?.category;

  if (category) {
    return {
      title: `${category}_淘课网`,
      description: `淘课网视频课程频道，最全的${category}在线培训课程库，涵盖销售、生产、物流等各种视频课程，让您足不出户就可掌握工作中必备的知识和技能。`,
      keywords: joinKeywords(category, '录播课', '在线培训', '企业学习'),
    };
  }

  return {
    title: '视频课程,在线课程,网络课程-淘课网',
    description:
      '淘课网视频课程频道，最全的在线培训课程库，涵盖销售、生产、物流等各种视频课程，让您足不出户就可掌握工作中必备的知识和技能。',
    keywords: joinKeywords('录播课', '在线培训', '企业学习'),
  };
}

// ─── 录播课详情 ───────────────────────────────────────────

export function buildVideoDetailMetadata(video: VideoDetail): SeoFields {
  const intro = stripHtml(video.intro);
  const descParts = [intro.slice(0, 80), video.keywords, video.categoryName || video.videoTypeLabel]
    .map((s) => s?.trim())
    .filter(Boolean);

  return {
    title: `${video.title}_录播课_在线学习_淘课网`,
    description:
      descParts.length > 0
        ? `《${video.title}》录播课覆盖${descParts.join('、')}，支持在线学习企业培训知识，适合员工自主提升与企业统一采购。`
        : `《${video.title}》录播课提供在线学习内容、课程目录与购买信息，适合企业员工按需学习管理与岗位技能课程。`,
    keywords: joinKeywords(video.title, video.categoryName, '录播课', '在线课程'),
  };
}

// ─── 机构列表 ─────────────────────────────────────────────

export function buildInstitutionListMetadata(filter?: FilterContext): SeoFields {
  const prefix = joinFilterPrefix(filter ?? {});
  const fieldLabel = filter?.category ?? parseFieldLabel(filter?.field);

  if (prefix || fieldLabel) {
    const label = prefix || fieldLabel || '';
    return {
      title: `${label}培训机构_淘课网`,
      description: `淘课网汇聚众多${label}培训机构，涵盖销售、生产、物流等各种培训课程，让您足不出户就可掌握工作中必备的知识和技能。`,
      keywords: joinKeywords(label, '培训机构', '培训公司'),
    };
  }

  return {
    title: '培训机构,培训公司-淘课网',
    description:
      '淘课网有注册培训机构或培训公司5万多家，已为培训机构输送学员总量近10万人次，为培训机构免费提供课程发布、课程推广、形象展示、学员推介和需求速递等招生服务。',
    keywords: joinKeywords('培训机构', '企业培训机构', '培训公司'),
  };
}

// ─── 机构详情 ─────────────────────────────────────────────

export function buildInstitutionDetailMetadata(institution: InstitutionDetail): SeoFields {
  const courseResource =
    institution.openCourseCount || institution.innerCourseCount
      ? `公开课${institution.openCourseCount}门、内训课${institution.innerCourseCount}门`
      : undefined;

  const descParts = [
    institution.specialties,
    institution.industries,
    institution.bio,
    courseResource,
  ]
    .map((s) => s?.trim())
    .filter(Boolean);

  return {
    title: `${institution.orgName}_培训机构_淘课网`,
    description:
      descParts.length > 0
        ? `${institution.orgName}是淘课网入驻培训机构，服务方向包含${descParts.join('、')}，可对接企业内训、公开课与长期培训项目。`
        : `${institution.orgName}是淘课网入驻培训机构，提供企业培训课程、师资团队与定制服务信息，便于企业采购方筛选合作伙伴。`,
    keywords: joinKeywords(institution.orgName, '培训机构', '企业培训服务商'),
  };
}

// ─── 导出 Metadata 便捷方法 ─────────────────────────────

export function homeMetadata(canonical = '/') {
  return toMetadata({ ...buildHomeMetadata(), canonical });
}

export function trainerListMetadata(filter?: FilterContext, canonical = '/trainer') {
  return toMetadata({ ...buildTrainerListMetadata(filter), canonical });
}

export function trainerDetailMetadata(trainer: TrainerDetail, canonical?: string) {
  return toMetadata({ ...buildTrainerDetailMetadata(trainer), canonical });
}

export function openCourseListMetadata(
  filter?: FilterContext,
  canonical = '/opencourse',
  canonicalParams?: URLSearchParams,
) {
  return toMetadata({
    ...buildOpenCourseListMetadata(filter),
    canonical,
    canonicalParams,
    canonicalQueryKeys: ['categoryName', 'cityName', 'page'],
  });
}

export function openCourseDetailMetadata(course: CourseDetail, planIndex = 0, canonical?: string) {
  return toMetadata({ ...buildOpenCourseDetailMetadata(course, planIndex), canonical });
}

export function innerCourseListMetadata(
  filter?: FilterContext,
  canonical = '/inhousecourse',
  canonicalParams?: URLSearchParams,
) {
  return toMetadata({
    ...buildInnerCourseListMetadata(filter),
    canonical,
    canonicalParams,
    canonicalQueryKeys: ['categoryName', 'page'],
  });
}

export function innerCourseDetailMetadata(course: CourseDetail, canonical?: string) {
  return toMetadata({ ...buildInnerCourseDetailMetadata(course), canonical });
}

export function videoListMetadata(
  filter?: FilterContext,
  canonical = '/video',
  canonicalParams?: URLSearchParams,
) {
  return toMetadata({
    ...buildVideoListMetadata(filter),
    canonical,
    canonicalParams,
    canonicalQueryKeys: ['categoryName', 'page'],
  });
}

export function videoDetailMetadata(video: VideoDetail, canonical?: string) {
  return toMetadata({ ...buildVideoDetailMetadata(video), canonical });
}

export function institutionListMetadata(
  filter?: FilterContext,
  canonical = '/company',
  canonicalParams?: URLSearchParams,
) {
  return toMetadata({
    ...buildInstitutionListMetadata(filter),
    canonical,
    canonicalParams,
    canonicalQueryKeys: ['categoryName', 'page'],
  });
}

export function institutionDetailMetadata(institution: InstitutionDetail, canonical?: string) {
  return toMetadata({ ...buildInstitutionDetailMetadata(institution), canonical });
}

// ─── 案例详情 ─────────────────────────────────────────────

export function buildCaseDetailMetadata(
  caseData: TrainerCase,
  trainerName?: string,
): SeoFields {
  const name = trainerName?.trim() || '培训专家';
  const descParts = [
    caseData.description,
    caseData.trainingTopic,
    caseData.trainingEffect,
  ]
    .map((s) => s?.trim())
    .filter(Boolean);

  return {
    title: `${caseData.caseTitle}_${name}_淘课网`,
    description:
      descParts.length > 0
        ? `《${caseData.caseTitle}》展示${name}服务企业培训的真实案例，包含${descParts.join('、')}，可参考同类项目落地效果。`
        : `《${caseData.caseTitle}》是淘课网企业培训案例，展示客户背景、培训主题、实施过程与效果数据，便于企业参考选型。`,
    keywords: joinKeywords(
      name,
      caseData.trainingDate,
      caseData.trainingAddress,
      caseData.industry,
      caseData.enterpriseName,
    ),
  };
}

export function caseDetailMetadata(caseData: TrainerCase, trainerName?: string, canonical?: string) {
  return toMetadata({ ...buildCaseDetailMetadata(caseData, trainerName), canonical });
}

/** 兜底详情页 metadata */
export function fallbackDetailMetadata(label: string, canonical?: string) {
  return toMetadata({
    title: `${label} - 淘课网`,
    description: `${label}提供淘课网企业培训资源信息，帮助企业培训负责人了解课程、讲师、机构与案例内容，快速筛选适合的企业培训方案。`,
    canonical,
  });
}

/** 城市综合频道页 TDK */
export function buildCityChannelMetadata(cityName: string, canonical?: string) {
  return toMetadata({
    title: `${cityName}企业培训_${cityName}公开课_内训课_培训讲师_培训机构 - 新淘课网`,
    keywords: joinKeywords(
      `${cityName}培训`,
      `${cityName}公开课`,
      `${cityName}内训课`,
      `${cityName}培训讲师`,
      `${cityName}培训机构`,
    ),
    description: `汇集${cityName}地区优质公开课、企业内训课程、资深培训讲师与正规培训机构，覆盖多行业实战培训，提供一站式企业培训服务。`,
    canonical,
  });
}

export { truncateDescription };
