'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EnrollFormData } from './enroll-form';

interface CourseEnrollFormFieldsProps {
  form: EnrollFormData;
  update: (patch: Partial<EnrollFormData>) => void;
  disabled?: boolean;
}

export function CourseEnrollFormFields({
  form,
  update,
  disabled = false,
}: CourseEnrollFormFieldsProps) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="enroll-realName">
          真实姓名 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="enroll-realName"
          value={form.realName}
          onChange={(e) => update({ realName: e.target.value })}
          placeholder="请填写真实姓名"
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="enroll-companyName">
          公司名称 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="enroll-companyName"
          value={form.companyName}
          onChange={(e) => update({ companyName: e.target.value })}
          placeholder="请填写公司名称"
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="enroll-email">
          电子邮件 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="enroll-email"
          type="email"
          value={form.email}
          onChange={(e) => update({ email: e.target.value })}
          placeholder="请填写 email"
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="enroll-companyPhone">公司电话</Label>
        <Input
          id="enroll-companyPhone"
          value={form.companyPhone}
          onChange={(e) => update({ companyPhone: e.target.value })}
          placeholder="请填写电话"
          disabled={disabled}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="enroll-mobile">手机号码</Label>
        <Input
          id="enroll-mobile"
          value={form.mobile}
          onChange={(e) => update({ mobile: e.target.value })}
          placeholder="请填写手机号码"
          disabled={disabled}
        />
        <p className="text-xs text-sky-600">提醒:电话或手机可选填一个</p>
      </div>
    </>
  );
}
