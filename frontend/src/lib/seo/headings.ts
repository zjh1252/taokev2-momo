import { parseFieldLabel } from './helpers';
import type { FilterContext } from './metadata';

/** 首页 Hero H1 */
export const HOME_H1 = '找得到、信得过、价更优、+AI';

export function trainerListH1(_filter?: FilterContext): string {
  return '培训讲师推荐';
}

export function openCourseListH1(filter?: FilterContext): string {
  const field = filter?.category ?? parseFieldLabel(filter?.field);
  return field ? `${field}企业公开课` : '公开课课程列表';
}

export function innerCourseListH1(filter?: FilterContext): string {
  const field = filter?.category ?? parseFieldLabel(filter?.field);
  return field ? `${field}企业内训课` : '企业内训课程';
}

export function videoListH1(filter?: FilterContext): string {
  const field = filter?.category;
  return field ? `${field}企业培训录播课程` : '企业培训录播课程';
}

export function institutionListH1(filter?: FilterContext): string {
  const field = filter?.category ?? parseFieldLabel(filter?.field);
  return field ? `${field}培训机构` : '培训机构';
}

/** 专家卡片 H3：姓名｜核心领域 */
export function trainerCardH3(name: string, expertise?: string): string {
  return expertise ? `${name}｜${expertise}` : name;
}

/** 专家详情模块 H3 */
export function trainerSectionH3(trainerName: string, module: string): string {
  if (module === '专家资质' || module === '资质背景') {
    return `${trainerName}专家资质`;
  }
  if (module === '部分客户') {
    return `${trainerName}的部分客户`;
  }
  if (module === '著作') {
    return `${trainerName}的著作`;
  }
  return `${trainerName}的${module}`;
}

/** 课程详情模块 H3 */
export function courseSectionH3(courseTitle: string, module: string): string {
  return `${courseTitle}${module}`;
}

/** 机构详情模块 H3 */
export function institutionSectionH3(orgName: string, module: string): string {
  return `${orgName}${module}`;
}
