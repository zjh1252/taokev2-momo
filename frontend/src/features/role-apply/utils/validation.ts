/**
 * 表单验证工具
 *
 * @author Fangxinxin
 * @date 2026-04-16
 */

import type {
  ApplyableRole,
  EnterpriseBuyerFormData,
  TrainerFormData,
  AgentFormData,
  AssistantFormData,
  EnterpriseAgentFormData,
  InstitutionFormData,
  InstitutionEmployeeFormData,
} from '../api/types';

/** 验证错误信息 */
export interface ValidationError {
  field: string;
  message: string;
}

/** 验证结果 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** 字段验证规则 */
export interface FieldRule {
  required?: boolean;
  requiredMessage?: string;
  validator?: (value: unknown) => string | undefined;
}

/** 表单验证规则配置 */
export type FormValidationRules<T> = Partial<Record<keyof T, FieldRule>>;

// ---- 各角色表单验证规则 ----

export const ENTERPRISE_BUYER_RULES: FormValidationRules<EnterpriseBuyerFormData> = {
  companyName: { required: true, requiredMessage: '请输入企业名称' },
  industry: { required: true, requiredMessage: '请选择所属行业' },
  contactName: { required: true, requiredMessage: '请输入联系人姓名' },
  contactPhone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: (value) => {
      const phone = value as string;
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return '请输入正确的11位手机号';
      }
      return undefined;
    },
  },
};

export const TRAINER_RULES: FormValidationRules<TrainerFormData> = {
  name: { required: true, requiredMessage: '请输入姓名' },
  gender: { required: true, requiredMessage: '请选择性别' },
  phone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: (value) => {
      const phone = value as string;
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return '请输入正确的11位手机号';
      }
      return undefined;
    },
  },
  provinceId: { required: true, requiredMessage: '请选择省份' },
  cityId: { required: true, requiredMessage: '请选择城市' },
  bio: { required: true, requiredMessage: '请输入个人简介' },
  goodAt: { required: true, requiredMessage: '请选择擅长领域' },
};

export const AGENT_RULES: FormValidationRules<AgentFormData> = {
  contactPhone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: (value) => {
      const phone = value as string;
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return '请输入正确的11位手机号';
      }
      return undefined;
    },
  },
  bio: { required: true, requiredMessage: '请输入个人简介' },
  specialties: { required: true, requiredMessage: '请输入擅长方向' },
};

export const ASSISTANT_RULES: FormValidationRules<AssistantFormData> = {
  contactPhone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: (value) => {
      const phone = value as string;
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return '请输入正确的11位手机号';
      }
      return undefined;
    },
  },
  bio: { required: true, requiredMessage: '请输入个人简介' },
};

export const ENTERPRISE_AGENT_RULES: FormValidationRules<EnterpriseAgentFormData> = {
  companyName: { required: true, requiredMessage: '请输入公司名称' },
  licenseNo: { required: true, requiredMessage: '请输入营业执照号' },
  contactName: { required: true, requiredMessage: '请输入联系人姓名' },
  contactPhone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: (value) => {
      const phone = value as string;
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return '请输入正确的11位手机号';
      }
      return undefined;
    },
  },
};

export const INSTITUTION_RULES: FormValidationRules<InstitutionFormData> = {
  orgName: { required: true, requiredMessage: '请输入机构名称' },
  orgType: { required: true, requiredMessage: '请选择机构类型' },
  bio: { required: true, requiredMessage: '请输入机构介绍' },
  contactName: { required: true, requiredMessage: '请输入联系人姓名' },
  contactPhone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: (value) => {
      const phone = value as string;
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return '请输入正确的11位手机号';
      }
      return undefined;
    },
  },
};

export const INSTITUTION_EMPLOYEE_RULES: FormValidationRules<InstitutionEmployeeFormData> = {
  contactPhone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: (value) => {
      const phone = value as string;
      if (!/^1[3-9]\d{9}$/.test(phone)) {
        return '请输入正确的11位手机号';
      }
      return undefined;
    },
  },
  orgId: { required: true, requiredMessage: '请输入所属机构ID' },
};

/** 角色验证规则映射 */
export const VALIDATION_RULES_MAP: Record<ApplyableRole, FormValidationRules<unknown>> = {
  ENTERPRISE_BUYER: ENTERPRISE_BUYER_RULES,
  TRAINER: TRAINER_RULES,
  AGENT: AGENT_RULES,
  ASSISTANT: ASSISTANT_RULES,
  ENTERPRISE_AGENT: ENTERPRISE_AGENT_RULES,
  INSTITUTION: INSTITUTION_RULES,
  INSTITUTION_EMPLOYEE: INSTITUTION_EMPLOYEE_RULES,
};

/**
 * 验证单个字段
 */
export function validateField(value: unknown, rule: FieldRule): string | undefined {
  // 必填检查
  if (rule.required) {
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);
    if (isEmpty) {
      return rule.requiredMessage || '此字段为必填项';
    }
  }

  // 自定义验证
  if (rule.validator && value) {
    const error = rule.validator(value);
    if (error) {
      return error;
    }
  }

  return undefined;
}

/**
 * 验证整个表单
 */
export function validateForm<T extends Record<string, unknown>>(
  formData: Partial<T>,
  rules: FormValidationRules<T>,
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [field, rule] of Object.entries(rules) as [keyof T, FieldRule][]) {
    const value = formData[field];
    const error = validateField(value, rule);
    if (error) {
      errors.push({ field: field as string, message: error });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 根据角色验证表单
 */
export function validateRoleForm(
  role: ApplyableRole,
  formData: Record<string, unknown>,
): ValidationResult {
  const rules = VALIDATION_RULES_MAP[role];
  return validateForm(formData, rules);
}

/**
 * 获取第一个错误消息（用于快速提示）
 */
export function getFirstError(errors: ValidationError[]): string | undefined {
  return errors[0]?.message;
}
