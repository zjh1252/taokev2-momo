'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RegionCascader from '@/components/region-cascader';
import type { RegionValue } from '@/components/region-cascader';
import {
  validateForm,
  Validators,
  getFirstError,
  type FormValidationRules,
} from '@/lib/validation';
import { useAuth } from '@/lib/auth/auth-context';
import { submitTrainerMessage } from '../api/service';

interface TrainerMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainerUserId: number;
  trainerName?: string;
  onSuccess?: () => void;
}

interface MessageFormData extends Record<string, unknown> {
  trainingTopic: string;
  trainingGoal: string;
  contactName: string;
  contactMobile: string;
  companyName: string;
  companyPhone: string;
  provinceId: number | null;
  cityId: number | null;
  districtId: number | null;
  trainingDays: string;
  email: string;
  remark: string;
}

const MESSAGE_RULES: FormValidationRules<MessageFormData> = {
  trainingTopic: { required: true, requiredMessage: '请输入培训主题（2~30字）' },
  contactName: { required: true, requiredMessage: '请填写联系人姓名' },
  contactMobile: {
    required: true,
    requiredMessage: '请填写联系手机',
    validator: Validators.phone,
  },
  companyName: { required: true, requiredMessage: '请填写公司名称' },
  provinceId: { required: true, requiredMessage: '请选择省份' },
  cityId: { required: true, requiredMessage: '请选择城市' },
  districtId: { required: true, requiredMessage: '请选择区/县' },
};

const INITIAL_FORM: MessageFormData = {
  trainingTopic: '',
  trainingGoal: '',
  contactName: '',
  contactMobile: '',
  companyName: '',
  companyPhone: '',
  provinceId: null,
  cityId: null,
  districtId: null,
  trainingDays: '',
  email: '',
  remark: '',
};

export default function TrainerMessageDialog({
  open,
  onOpenChange,
  trainerUserId,
  trainerName,
  onSuccess,
}: TrainerMessageDialogProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<MessageFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = (patch: Partial<MessageFormData>) => setForm((prev) => ({ ...prev, ...patch }));

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setError('');
  }, []);

  useEffect(() => {
    if (!open || !user?.phone) return;
    setForm((prev) => (prev.contactMobile ? prev : { ...prev, contactMobile: user.phone }));
  }, [open, user?.phone]);

  const handleSubmit = async () => {
    const result = validateForm(form, MESSAGE_RULES);
    if (!result.valid) {
      setError(getFirstError(result.errors) || '请完善必填项');
      return;
    }
    if (form.trainingTopic.trim().length < 2) {
      setError('培训主题至少 2 个字符');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await submitTrainerMessage({
        trainerUserId,
        trainingTopic: form.trainingTopic,
        trainingGoal: form.trainingGoal || undefined,
        contactName: form.contactName,
        contactMobile: form.contactMobile,
        companyName: form.companyName,
        companyPhone: form.companyPhone || undefined,
        provinceId: form.provinceId ?? undefined,
        cityId: form.cityId ?? undefined,
        districtId: form.districtId ?? undefined,
        trainingDays: form.trainingDays || undefined,
        email: form.email || undefined,
        remark: form.remark || undefined,
      });
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            给{trainerName ? ` ${trainerName} ` : '专家'}留言
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>培训主题 <span className="text-destructive">*</span></Label>
            <Input
              value={form.trainingTopic}
              onChange={(e) => update({ trainingTopic: e.target.value })}
              placeholder="请输入培训主题（2~30字）"
              maxLength={30}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>培训目标</Label>
            <Textarea
              value={form.trainingGoal}
              onChange={(e) => update({ trainingGoal: e.target.value })}
              placeholder="请输入培训目标（选填）"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>联系人 <span className="text-destructive">*</span></Label>
              <Input
                value={form.contactName}
                onChange={(e) => update({ contactName: e.target.value })}
                placeholder="姓名"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>联系手机 <span className="text-destructive">*</span></Label>
              <Input
                value={form.contactMobile}
                onChange={(e) => update({ contactMobile: e.target.value })}
                placeholder="手机号码"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>公司名称 <span className="text-destructive">*</span></Label>
              <Input
                value={form.companyName}
                onChange={(e) => update({ companyName: e.target.value })}
                placeholder="公司名称"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>公司电话</Label>
              <Input
                value={form.companyPhone}
                onChange={(e) => update({ companyPhone: e.target.value })}
                placeholder="选填"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>所在地区 <span className="text-destructive">*</span></Label>
            <RegionCascader
              maxLevel={3}
              requireDistrict
              value={{
                provinceId: form.provinceId ?? undefined,
                cityId: form.cityId ?? undefined,
                districtId: form.districtId ?? undefined,
              }}
              onChange={(val: RegionValue) =>
                update({
                  provinceId: val.provinceId ?? null,
                  cityId: val.cityId ?? null,
                  districtId: val.districtId ?? null,
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>培训天数</Label>
              <Input
                value={form.trainingDays}
                onChange={(e) => update({ trainingDays: e.target.value })}
                placeholder="如：2天"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="选填"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>备注</Label>
            <Textarea
              value={form.remark}
              onChange={(e) => update({ remark: e.target.value })}
              placeholder="其他需要说明的情况（选填）"
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '提交中...' : '提交留言'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
