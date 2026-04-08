/** localStorage 中存储 token 的 key */
export const TOKEN_KEY = 'taoke_token';

/**
 * 业务角色码：专家（与后端 {@code BusinessRole.Code.TRAINER} 一致）
 * <p>顶栏「我的主页」仅当该角色且状态为生效时展示，并链至 {@code /trainers/{id}}。</p>
 */
export const ROLE_TRAINER = 'TRAINER';
