'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  validateForm,
  Validators,
  getFirstError,
  type FormValidationRules,
} from '@/lib/validation';
import { useAuthOptional } from '@/lib/auth/auth-context';
import { submitOpenCourseEnrollment } from '../../api/service';

interface OpenCourseEnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  planId: number;
  onSuccess?: () => void;
}

interface EnrollFormData extends Record<string, unknown> {
  realName: string;
  companyName: string;
  email: string;
  companyPhone: string;
  mobile: string;
}

const INITIAL: EnrollFormData = {
  realName: '',
  companyName: '',
  email: '',
  companyPhone: '',
  mobile: '',
};

const RULES: FormValidationRules<EnrollFormData> = {
  realName: { required: true, requiredMessage: '请填写真实姓名' },
  companyName: { required: true, requiredMessage: '请填写公司名称' },
  email: {
    required: true,
    requiredMessage: '请填写电子邮件',
    validator: Validators.email,
  },
};

export function OpenCourseEnrollDialog({
  open,
  onOpenChange,
  courseId,
  planId,
  onSuccess,
}: OpenCourseEnrollDialogProps) {
  const { user } = useAuthOptional() ?? { user: null };
  const [form, setForm] = useState<EnrollFormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (patch: Partial<EnrollFormData>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const resetForm = useCallback(() => {
    setForm(INITIAL);
    setError('');
  }, []);

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      ...prev,
      mobile: prev.mobile || user?.phone || '',
    }));
  }, [open, user?.phone]);

  const handleSubmit = async () => {
    const result = validateForm(form, RULES);
    if (!result.valid) {
      setError(getFirstError(result.errors) || '请完善必填项');
      return;
    }
    if (!form.companyPhone.trim() && !form.mobile.trim()) {
      setError('提醒:电话或手机可选填一个');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await submitOpenCourseEnrollment({
        realName: form.realName.trim(),
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        companyPhone: form.companyPhone.trim() || undefined,
        mobile: form.mobile.trim() || undefined,
        courseId,
        planId,
      });
      toast.success('报名提交成功，顾问稍后将与您联系');
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>请输入您的联系信息：</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-800">快速咨询</p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2 leading-relaxed">
            为了能够及时向你做出相应的解答或进行确认，请准确填写以下信息，我们的顾问稍后将与您联系。
          </p>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="enroll-realName">
              真实姓名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="enroll-realName"
              value={form.realName}
              onChange={(e) => update({ realName: e.target.value })}
              placeholder="请填写真实姓名"
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
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enroll-companyPhone">公司电话</Label>
            <Input
              id="enroll-companyPhone"
              value={form.companyPhone}
              onChange={(e) => update({ companyPhone: e.target.value })}
              placeholder="请填写电话"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="enroll-mobile">手机号码</Label>
            <Input
              id="enroll-mobile"
              value={form.mobile}
              onChange={(e) => update({ mobile: e.target.value })}
              placeholder="请填写手机号码"
            />
            <p className="text-xs text-sky-600">提醒:电话或手机可选填一个</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? '提交中…' : '提交'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
