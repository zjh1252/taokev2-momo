/** 培训宝发布需求表单校验 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^1[3-9]\d{9}$/;

export function isPlaceholder(value: string, placeholders: string[]): boolean {
  const t = value.trim();
  return !t || placeholders.includes(t);
}

export function validateTitle(title: string): string | null {
  const t = title.trim();
  if (!t) return '标题不能为空';
  if (t.length < 2 || t.length > 30) return '标题限制2~30个字符';
  return null;
}

export function validateDescription(text: string, label = '需求描述'): string | null {
  const t = text.trim();
  if (!t) return `${label}不能为空`;
  if (t.length < 20) return `${label}至少20个字符`;
  return null;
}

export function validateEmail(email: string): string | null {
  const t = email.trim();
  if (!t) return 'Email不能为空';
  if (!EMAIL_RE.test(t)) return 'Email格式不正确';
  return null;
}

export function validateContactPhone(mobile: string, tel: string): string | null {
  const m = mobile.trim();
  const t = tel.trim();
  if (!m && !t) return '请填写公司电话或联系手机';
  if (m && !MOBILE_RE.test(m)) return '手机号码格式不正确';
  return null;
}

export function validateRequiredText(value: string, label: string): string | null {
  if (!value.trim()) return `${label}不能为空`;
  return null;
}

export function validateProposalCount(value: string): string | null {
  const n = Number(value);
  if (!value.trim() || !Number.isInteger(n) || n < 1) return '请输入有效的期望方案数';
  return null;
}

export const OPEN_TITLE_PLACEHOLDER = '标题限制2~30个字符';
export const OPEN_REMARK_PLACEHOLDER =
  '请填写详细的公开课需求，如讲师资历、课程内容、培训对象类型、行业背景等等，至少20字符';
export const INTERNAL_TITLE_PLACEHOLDER = '标题限制2~30个字符';
export const INTERNAL_TARGET_PLACEHOLDER =
  '请输入你详细的培训需求，以便我们更加精准地为你找到适合的供应商，如：行业要求、课程分类、报价、培训时长等等。';
