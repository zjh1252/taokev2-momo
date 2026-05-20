/**
 * 角色绑定相关类型定义。
 *
 * @author Fangxinxin
 * @date 2026-04-21 17:00
 */

/** 绑定类型枚举 */
export type BindingType =
  | 'AGENT_TRAINER'
  | 'ASSISTANT_TRAINER'
  | 'INSTITUTION_TRAINER'
  | 'INSTITUTION_EMPLOYEE'
  | 'ENTERPRISE_AGENT_TRAINER'
  | 'ENTERPRISE_AGENT_MEMBER';

/** 绑定状态：1=ACTIVE 2=PENDING 3=UNBOUND 4=REJECTED */
export const BINDING_STATUS = {
  ACTIVE: 1,
  PENDING: 2,
  UNBOUND: 3,
  REJECTED: 4,
} as const;

export interface BindingItem {
  id: number;
  bindingType: BindingType;
  status: number;
  statusLabel?: string;
  counterpartUserId?: number;
  counterpartRole?: string;
  counterpartRoleLabel?: string;
  counterpartNickname?: string;
  /** 对方账号名（登录用户名，可能为空） */
  counterpartUsername?: string;
  /** 对方真实姓名（如已实名/已填写） */
  counterpartRealName?: string;
  /** 对方手机号 */
  counterpartPhone?: string;
  counterpartAvatarUrl?: string;
  counterpartOrgName?: string;
  note?: string;
  rejectReason?: string;
  initiatorUserId?: number;
  /**
   * 当前用户是否为发起方
   *
   * <p>命名为 ifInitiator 而非 iAmInitiator 是为了规避 Java Bean Introspector 的大小写陷阱，
   * 详见 BindingItemResponse 后端字段注释。</p>
   */
  ifInitiator?: boolean;
  createdAt?: string;
  confirmedAt?: string;
}

export interface InitiateBindingPayload {
  bindingType: BindingType;
  targetUserId: number;
  note?: string;
}
