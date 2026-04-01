/** localStorage 中存储 token 的 key */
export const TOKEN_KEY = 'taoke_token';

/**
 * 拥有公开主页的角色列表
 * <p>
 * 对应后端 BusinessRole 枚举中的 TRAINER / INSTITUTION / INSTITUTION_EMPLOYEE
 * </p>
 */
export const PUBLIC_PROFILE_ROLES = ['TRAINER', 'INSTITUTION', 'INSTITUTION_EMPLOYEE'] as const;
