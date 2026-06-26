/**
 * 代管/绑定角色相关的前端工具函数。
 *
 * <p>这些角色（除 INSTITUTION 外）本身不直接发布资源，而是通过与「专家」
 * 的绑定关系，代为发布/管理专家的课程、案例、精彩瞬间、视频等资源。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-21 18:30
 */

/** 具备「代管专家资源」能力的角色编码集合。 */
export const DELEGATING_ROLES = [
  'INSTITUTION',
  'INSTITUTION_EMPLOYEE',
  'AGENT',
  'ENTERPRISE_AGENT',
  'ASSISTANT',
] as const;

export type DelegatingRole = (typeof DELEGATING_ROLES)[number];

/**
 * 判断当前激活角色是否属于「代管角色」。
 * <ul>
 *   <li>TRAINER 自身仅代表自己，不属于代管角色。</li>
 *   <li>BUYER / ENTERPRISE_BUYER 等不参与资源代发，亦不属于。</li>
 * </ul>
 */
export function isDelegatingRole(role?: string | null): boolean {
  return !!role && (DELEGATING_ROLES as readonly string[]).includes(role);
}

/**
 * 「我自己」是否在该角色场景下有意义：
 * <ul>
 *   <li>INSTITUTION：机构号本身可自研发布资源 → true</li>
 *   <li>ENTERPRISE_AGENT：经纪公司可自研发布资源 → true</li>
 *   <li>其他代管角色：自己没有资源主体，「我自己」无意义 → false</li>
 * </ul>
 */
export function selfPublishingAllowed(role?: string | null): boolean {
  return role === 'INSTITUTION' || role === 'ENTERPRISE_AGENT';
}

/**
 * 当前角色是否「必须绑定专家」才能发布资源：
 * <ul>
 *   <li>AGENT / ASSISTANT / INSTITUTION_EMPLOYEE：自身没有资源主体，必须代专家发布 → true</li>
 *   <li>TRAINER：自己即资源主体 → false</li>
 *   <li>INSTITUTION / ENTERPRISE_AGENT：可自研发布 → false</li>
 * </ul>
 */
export const ROLES_REQUIRING_TRAINER_BINDING = [
  'AGENT',
  'ASSISTANT',
  'INSTITUTION_EMPLOYEE',
] as const;

export function requiresTrainerBinding(role?: string | null): boolean {
  return (
    !!role &&
    (ROLES_REQUIRING_TRAINER_BINDING as readonly string[]).includes(role)
  );
}
