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
import { useAuthOptional } from '@/lib/auth/auth-context';
import { submitInternalCourseEnrollment } from '../../api/service';
import { CourseEnrollFormFields } from './CourseEnrollFormFields';
import {
  ENROLL_FORM_INITIAL,
  validateEnrollForm,
  type EnrollFormData,
} from './enroll-form';

interface InternalCourseEnrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: number;
  onSuccess?: () => void;
}

export function InternalCourseEnrollDialog({
  open,
  onOpenChange,
  courseId,
  onSuccess,
}: InternalCourseEnrollDialogProps) {
  const { user } = useAuthOptional() ?? { user: null };
  const [form, setForm] = useState<EnrollFormData>(ENROLL_FORM_INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (patch: Partial<EnrollFormData>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const resetForm = useCallback(() => {
    setForm(ENROLL_FORM_INITIAL);
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
    const validationError = validateEnrollForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await submitInternalCourseEnrollment({
        realName: form.realName.trim(),
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        companyPhone: form.companyPhone.trim() || undefined,
        mobile: form.mobile.trim() || undefined,
        courseId,
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

          <CourseEnrollFormFields
            form={form}
            update={update}
            disabled={submitting}
          />
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
