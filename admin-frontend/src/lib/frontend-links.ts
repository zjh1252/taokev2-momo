/**
 * 后台跳转 C 端前台页面的链接构建工具。
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */

const FRONTEND_BASE_URL = (
  process.env.NEXT_PUBLIC_FRONTEND_BASE_URL ??
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '')
).replace(/\/+$/, '');

const DEFAULT_LOCALE = 'zh-CN';

function buildUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!FRONTEND_BASE_URL) return normalized;
  return `${FRONTEND_BASE_URL}${normalized}`;
}

/** 专家主页（trainerId 为 user_trainers.id） */
export function getTrainerPublicUrl(trainerId: number): string {
  return buildUrl(`/${DEFAULT_LOCALE}/trainers/${trainerId}`);
}

/** 机构主页 */
export function getInstitutionPublicUrl(institutionId: number): string {
  return buildUrl(`/${DEFAULT_LOCALE}/institutions/${institutionId}`);
}

/** 课程详情页（与 C 端 getCourseDetailPath 一致） */
export function getCoursePublicUrl(
  courseId: number,
  type?: string | null,
): string {
  const isOpen =
    type === 'OPEN_OFFLINE' || type === 'OPEN_ONLINE' || type === 'open';
  const segment = isOpen ? 'opencourse' : 'inhousecourse';
  return buildUrl(`/${DEFAULT_LOCALE}/${segment}/${courseId}.htm`);
}

/** 用户详情暂走后台用户管理（前台无统一用户页） */
export function getAdminUserDetailUrl(userId: number): string {
  return `/dashboard/users/${userId}`;
}
