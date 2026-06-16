/**
 * 业务角色（BusinessRole）—— 与后端 [BusinessRole.java](../../backend/taoke-common/src/main/java/com/taoke/common/enums/BusinessRole.java) 严格对齐
 *
 * 共 11 种业务角色（含业务方与运营方），按"阵营"分组：
 *   - BUYER   ：需求方（甲方）
 *   - SUPPLY_C：供给方（丙方）—— 专家及其衍生角色
 *   - SUPPLY_B：供给方（乙方）—— 机构及其衍生角色
 *   - OPS     ：平台运营方
 *
 * 使用：
 *   import { roleLabel, roleLabels } from '@/constants/role';
 *   roleLabel('TRAINER')            // => '专家'
 *   roleLabels(['TRAINER','AGENT']) // => ['专家', '专家经纪人']
 */

export const ROLE_CAMP = {
  BUYER:    { side: '甲方', label: '需求方' },
  SUPPLY_C: { side: '丙方', label: '供给方' },
  SUPPLY_B: { side: '乙方', label: '供给方' },
  OPS:      { side: '运营', label: '运营方' },
};

export const BUSINESS_ROLES = {
  // 需求方（甲方）
  ENTERPRISE_BUYER:     { label: '企业培训采购方', camp: 'BUYER' },
  BUYER:                { label: '个人学员',       camp: 'BUYER' },

  // 供给方（丙方）
  TRAINER:              { label: '专家',           camp: 'SUPPLY_C' },
  AGENT:                { label: '专家经纪人',     camp: 'SUPPLY_C' },
  ASSISTANT:            { label: '专家助理',       camp: 'SUPPLY_C' },
  ENTERPRISE_AGENT:     { label: '专家经纪公司',   camp: 'SUPPLY_C' },

  // 供给方（乙方）
  INSTITUTION:          { label: '机构',           camp: 'SUPPLY_B' },
  INSTITUTION_EMPLOYEE: { label: '机构员工',       camp: 'SUPPLY_B' },

  // 运营方
  PLATFORM_AUDITOR:     { label: '平台审核员',     camp: 'OPS' },
  PLATFORM_CS:          { label: '平台客服',       camp: 'OPS' },
  SUPER_ADMIN:          { label: '超级管理员',     camp: 'OPS' },
};

/** 单个角色 code → 中文名（找不到回原 code，便于发现新增枚举漏配） */
export function roleLabel(code) {
  if (!code) return '';
  return BUSINESS_ROLES[code]?.label || code;
}

/** 一组角色 code → 中文名数组（自动去空） */
export function roleLabels(codes) {
  return (codes || []).map(roleLabel).filter(Boolean);
}

/** 角色 code → 阵营信息（甲方 / 乙方 / 丙方 / 运营） */
export function roleCamp(code) {
  const campKey = BUSINESS_ROLES[code]?.camp;
  return campKey ? ROLE_CAMP[campKey] : null;
}

export default {
  ROLE_CAMP,
  BUSINESS_ROLES,
  roleLabel,
  roleLabels,
  roleCamp,
};
