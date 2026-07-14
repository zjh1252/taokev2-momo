'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes';
import { uploadImage } from '@/features/course/api/publisher-service';
import { submitLecturer721Application } from '../api/service';
import type { AllianceLecturer721ApplyPayload } from '../api/types';
import { SignaturePad } from './signature-pad';

type FormValues = Omit<
  AllianceLecturer721ApplyPayload,
  'agreementSigned' | 'agreementVersion'
>;
type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  lecturerName: '',
  idCardNo: '',
  coopYears: 3,
  dailyFee: 0,
  address: '',
  phone: '',
  wechat: '',
  email: '',
  bankName: '',
  bankAccount: '',
  signatureUrl: '',
};

/**
 * 721 讲师合作申请表单。
 *
 * @author Fangxinxin
 * @date 2026-07-14 14:15
 */
export function Lecturer721ApplyForm({
  rejectReason,
}: {
  rejectReason?: string | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function updateField<K extends keyof FormValues>(name: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function validate(): boolean {
    const next: FormErrors = {};
    if (!values.lecturerName.trim()) next.lecturerName = '请输入讲师姓名';
    if (!values.idCardNo.trim()) next.idCardNo = '请输入身份证号';
    if (![1, 2, 3].includes(values.coopYears)) next.coopYears = '请选择合作年限';
    if (!values.dailyFee || values.dailyFee <= 0) next.dailyFee = '请输入课酬';
    if (!values.address.trim()) next.address = '请输入地址';
    if (!values.phone.trim()) next.phone = '请输入手机号';
    if (!values.wechat.trim()) next.wechat = '请输入微信';
    if (!values.email.trim()) next.email = '请输入邮箱';
    if (!values.bankName.trim()) next.bankName = '请输入开户银行';
    if (!values.bankAccount.trim()) next.bankAccount = '请输入账号';
    if (!values.signatureUrl.trim()) next.signatureUrl = '请完成签字并上传';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await submitLecturer721Application({
        ...values,
        dailyFee: Number(values.dailyFee),
        agreementSigned: true,
        agreementVersion: 'v1',
      });
      toast.success('申请已提交');
      router.push(ROUTES.UC_ALLIANCE_721_PENDING);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交失败，请稍后重试');
      setSubmitting(false);
    }
  }

  return (
    <form className="w-full max-w-xl" onSubmit={(e) => void handleSubmit(e)}>
      {rejectReason ? (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="font-bold">上次申请未通过，可修改资料后重新提交。</p>
          <p className="mt-1">驳回原因：{rejectReason}</p>
        </div>
      ) : null}
      <div className="space-y-4">
        {(
          [
            ['lecturerName', '讲师姓名'],
            ['idCardNo', '身份证号'],
          ] as const
        ).map(([name, label]) => (
          <Field
            key={name}
            label={label}
            error={errors[name]}
            value={String(values[name])}
            onChange={(v) => updateField(name, v)}
          />
        ))}
        <div className="flex items-start">
          <label className="w-24 shrink-0 pt-2 pr-4 text-right text-sm text-gray-700">
            <span className="mr-1 text-red-500">*</span>合作年限
          </label>
          <div className="flex-1">
            <select
              value={values.coopYears}
              onChange={(e) => updateField('coopYears', Number(e.target.value))}
              className="w-full border border-gray-300 bg-white px-3 py-1.5 text-sm"
            >
              <option value={3}>3年</option>
              <option value={2}>2年</option>
              <option value={1}>1年</option>
            </select>
            {errors.coopYears ? (
              <p className="mt-1 text-xs text-red-500">{errors.coopYears}</p>
            ) : null}
          </div>
        </div>
        <Field
          label="课酬(元/天)"
          type="number"
          error={errors.dailyFee}
          value={values.dailyFee ? String(values.dailyFee) : ''}
          onChange={(v) => updateField('dailyFee', Number(v) || 0)}
        />
        {(
          [
            ['address', '地址'],
            ['phone', '手机号'],
            ['wechat', '微信'],
            ['email', 'Email'],
            ['bankName', '开户银行'],
            ['bankAccount', '账号'],
          ] as const
        ).map(([name, label]) => (
          <Field
            key={name}
            label={label}
            error={errors[name]}
            value={String(values[name])}
            onChange={(v) => updateField(name, v)}
          />
        ))}
        <div className="mt-4 flex items-start">
          <span className="w-24 shrink-0 pt-2 pr-4 text-right text-sm text-gray-700">
            <span className="mr-1 text-red-500">*</span>签字
          </span>
          <SignaturePad
            value={values.signatureUrl}
            error={errors.signatureUrl}
            onUploaded={(url) => updateField('signatureUrl', url)}
            onClear={() => updateField('signatureUrl', '')}
            upload={(blob) => uploadImage(blob, 'signature.png')}
          />
        </div>
      </div>
      <div className="mt-8 flex w-full justify-end pl-24">
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#f44336] py-3 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-[#d32f2f] disabled:opacity-60"
        >
          {submitting ? '提交中...' : '提交申请'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  error,
  type = 'text',
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-start">
      <label className="w-24 shrink-0 pt-2 pr-4 text-right text-sm text-gray-700">
        <span className="mr-1 text-red-500">*</span>
        {label}
      </label>
      <div className="flex-1">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="请输入"
          className="w-full border border-gray-300 px-3 py-1.5 text-sm focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] focus:outline-none"
        />
        {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
      </div>
    </div>
  );
}
