/**
 * 案例表单验证工具
 *
 * @author Fangxinxin
 * @date 2026-04-16
 */

import type { SaveTrainerCaseRequest } from '../api/types';

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

// ---- 案例表单验证规则 ----

export const CASE_RULES: FormValidationRules<SaveTrainerCaseRequest> = {
  caseTitle: { required: true, requiredMessage: '请输入案例标题' },
  enterpriseName: { required: true, requiredMessage: '请输入企业名称' },
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
 * 验证案例表单
 */
export function validateCaseForm(formData: Partial<SaveTrainerCaseRequest>): ValidationResult {
  return validateForm(formData, CASE_RULES);
}

/**
 * 获取第一个错误消息（用于快速提示）
 */
export function getFirstError(errors: ValidationError[]): string | undefined {
  return errors[0]?.message;
}
