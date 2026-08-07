import {
  validateForm,
  Validators,
  getFirstError,
  type FormValidationRules,
} from '@/lib/validation';

export interface EnrollFormData extends Record<string, unknown> {
  realName: string;
  companyName: string;
  email: string;
  companyPhone: string;
  mobile: string;
}

export const ENROLL_FORM_INITIAL: EnrollFormData = {
  realName: '',
  companyName: '',
  email: '',
  companyPhone: '',
  mobile: '',
};

export const ENROLL_FORM_RULES: FormValidationRules<EnrollFormData> = {
  realName: { required: true, requiredMessage: '请填写真实姓名' },
  companyName: { required: true, requiredMessage: '请填写公司名称' },
  email: {
    required: true,
    requiredMessage: '请填写电子邮件',
    validator: Validators.email,
  },
};

export function validateEnrollForm(form: EnrollFormData): string | null {
  const result = validateForm(form, ENROLL_FORM_RULES);
  if (!result.valid) {
    return getFirstError(result.errors) || '请完善必填项';
  }
  if (!form.companyPhone.trim() && !form.mobile.trim()) {
    return '提醒:电话或手机可选填一个';
  }
  return null;
}
