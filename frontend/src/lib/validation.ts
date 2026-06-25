/**
 * 表单验证引擎 - 底层验证方案封装
 *
 * @description 提供通用的表单验证能力，验证规则由各表单文件自行定义
 * @author Fangxinxin
 * @date 2026-04-17
 */

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
      (typeof value === 'string' && value.trim() === '') ||
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
 * 获取第一个错误消息（用于快速提示）
 */
export function getFirstError(errors: ValidationError[]): string | undefined {
  return errors[0]?.message;
}

/**
 * 常用验证器
 */
export const Validators = {
  /** 手机号验证 */
  phone: (value: unknown) => {
    const phone = value as string;
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return '请输入正确的11位手机号';
    }
    return undefined;
  },
  /** 邮箱验证 */
  email: (value: unknown) => {
    const email = value as string;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return '请输入正确的邮箱地址';
    }
    return undefined;
  },
  /** 营业执照号 / 统一社会信用代码（15位纯数字 或 18位大写字母/数字） */
  businessLicenseNo: (value: unknown) => {
    const no = String(value ?? '').trim();
    if (!/^\d{15}$|^[A-Z\d]{18}$/.test(no)) {
      return '营业执照号需为15位纯数字或18位大写统一社会信用代码';
    }
    return undefined;
  },
};
