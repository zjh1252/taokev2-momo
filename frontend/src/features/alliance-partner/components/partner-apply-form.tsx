'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import RegionCascader from '@/components/region-cascader';
import { ROUTES } from '@/config/routes';
import { submitPartnerApplication } from '../api/service';
import type { AlliancePartnerApplyPayload } from '../api/types';

type FormValues = Omit<
  AlliancePartnerApplyPayload,
  'agreementSigned' | 'agreementVersion'
>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  contactName: '',
  companyName: '',
  companyPhone: '',
  companyEmail: '',
  provinceId: 0,
  cityId: 0,
  legalPerson: '',
  legalIdCard: '',
  contactQq: '',
};

const REQUIRED_MESSAGES: Partial<Record<keyof FormValues, string>> = {
  contactName: '请输入联系人名字',
  companyName: '请输入公司名称',
  companyPhone: '请输入公司电话',
  companyEmail: '请输入公司邮箱',
  provinceId: '请选择省份',
  cityId: '请选择城市',
  legalPerson: '请输入公司法人',
  legalIdCard: '请输入法人身份证',
};

interface TextFieldProps {
  label: string;
  name: keyof FormValues;
  value: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'tel' | 'email';
  maxLength?: number;
  onChange: (name: keyof FormValues, value: string) => void;
}

function TextField({
  label,
  name,
  value,
  error,
  required,
  type = 'text',
  maxLength,
  onChange,
}: TextFieldProps) {
  return (
    <div className="flex items-start">
      <label
        htmlFor={`partner-${name}`}
        className="w-28 shrink-0 pt-2 pr-6 text-right text-sm text-gray-700"
      >
        {required ? <span className="mr-1 text-red-500">*</span> : null}
        {label}
      </label>
      <div className="flex-1">
        <input
          id={`partner-${name}`}
          name={name}
          type={type}
          value={value}
          maxLength={maxLength}
          onChange={(event) => onChange(name, event.target.value)}
          aria-invalid={!!error}
          className="w-full border border-gray-300 px-3 py-1.5 focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] focus:outline-none"
        />
        {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
      </div>
    </div>
  );
}

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  for (const [field, message] of Object.entries(REQUIRED_MESSAGES)) {
    const value = values[field as keyof FormValues];
    if (typeof value === 'string' ? !value.trim() : !value) {
      errors[field as keyof FormValues] = message;
    }
  }
  if (
    values.companyEmail.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.companyEmail.trim())
  ) {
    errors.companyEmail = '请输入正确的公司邮箱';
  }
  return errors;
}

/**
 * 培训合伙人申请表单。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:30
 */
export function PartnerApplyForm() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const updateValue = (name: keyof FormValues, value: string | number) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      await submitPartnerApplication({
        ...values,
        contactName: values.contactName.trim(),
        companyName: values.companyName.trim(),
        companyPhone: values.companyPhone.trim(),
        companyEmail: values.companyEmail.trim(),
        legalPerson: values.legalPerson.trim(),
        legalIdCard: values.legalIdCard.trim(),
        contactQq: values.contactQq.trim(),
        agreementSigned: true,
        agreementVersion: 'v1',
      });
      toast.success('申请已提交');
      router.push(ROUTES.UC_ALLIANCE_PARTNER_PENDING);
    } catch {
      // API 客户端已统一展示错误提示，保留当前表单供用户修改后重试。
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl" noValidate>
      <div className="mb-6 flex items-center">
        <span className="w-28 pr-6 text-right text-sm text-gray-700">
          你的身份
        </span>
        <label className="flex items-center gap-1.5 text-sm text-[#0066cc]">
          <input
            type="radio"
            name="identity"
            checked
            readOnly
            className="h-3.5 w-3.5"
          />
          公司
        </label>
      </div>

      <div className="space-y-4">
        <TextField
          label="联系人名字"
          name="contactName"
          value={values.contactName}
          error={errors.contactName}
          required
          maxLength={64}
          onChange={updateValue}
        />
        <TextField
          label="公司名称"
          name="companyName"
          value={values.companyName}
          error={errors.companyName}
          required
          maxLength={128}
          onChange={updateValue}
        />
        <TextField
          label="公司电话"
          name="companyPhone"
          value={values.companyPhone}
          error={errors.companyPhone}
          required
          type="tel"
          maxLength={32}
          onChange={updateValue}
        />
        <TextField
          label="公司邮箱"
          name="companyEmail"
          value={values.companyEmail}
          error={errors.companyEmail}
          required
          type="email"
          maxLength={128}
          onChange={updateValue}
        />
        <div className="flex items-start">
          <span className="w-28 shrink-0 pt-2 pr-6 text-right text-sm text-gray-700">
            <span className="mr-1 text-red-500">*</span>
            公司所在地
          </span>
          <div className="flex-1">
            <RegionCascader
              maxLevel={2}
              onChange={(region) => {
                updateValue('provinceId', region.provinceId ?? 0);
                updateValue('cityId', region.cityId ?? 0);
              }}
            />
            {errors.provinceId || errors.cityId ? (
              <p className="mt-1 text-xs text-red-500">
                {errors.provinceId || errors.cityId}
              </p>
            ) : null}
          </div>
        </div>
        <TextField
          label="公司法人"
          name="legalPerson"
          value={values.legalPerson}
          error={errors.legalPerson}
          required
          maxLength={64}
          onChange={updateValue}
        />
        <TextField
          label="法人身份证"
          name="legalIdCard"
          value={values.legalIdCard}
          error={errors.legalIdCard}
          required
          maxLength={32}
          onChange={updateValue}
        />
        <TextField
          label="联系人QQ"
          name="contactQq"
          value={values.contactQq}
          error={errors.contactQq}
          maxLength={32}
          onChange={updateValue}
        />
      </div>

      <div className="mt-10 text-center">
        <button
          type="submit"
          disabled={submitting}
          className="cursor-pointer rounded bg-[#cc0000] px-8 py-3 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-[#b30000] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? '正在提交...'
            : '本人同意上述协议并申请成为淘课培训合伙人'}
        </button>
      </div>
    </form>
  );
}
