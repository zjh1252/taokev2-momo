/** 需要代管专家才能发布内容的角色 */
export const DELEGATING_ROLES = ['AGENT', 'ASSISTANT', 'INSTITUTION_EMPLOYEE'];

/** 可发布/管理课程案例等内容的所有供给侧角色 */
export const CONTENT_ROLES = [
  'TRAINER',
  'AGENT',
  'ASSISTANT',
  'INSTITUTION',
  'INSTITUTION_EMPLOYEE',
  'ENTERPRISE_AGENT',
];

export function isDelegatingRole(role) {
  return DELEGATING_ROLES.includes(role);
}

export function isContentRole(role) {
  return CONTENT_ROLES.includes(role);
}

/** 代管角色是否允许以「自己」身份发布（机构/经纪公司可直接发布） */
export function selfPublishingAllowed(role) {
  return role === 'INSTITUTION' || role === 'ENTERPRISE_AGENT' || role === 'TRAINER';
}
