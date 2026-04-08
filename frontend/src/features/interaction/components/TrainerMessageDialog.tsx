'use client';

import { useState, useCallback } from 'react';
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
import { submitTrainerMessage } from '../api/service';

interface TrainerMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainerUserId: number;
  trainerName?: string;
  onSuccess?: () => void;
}

export default function TrainerMessageDialog({
  open,
  onOpenChange,
  trainerUserId,
  trainerName,
  onSuccess,
}: TrainerMessageDialogProps) {
  const [trainingTopic, setTrainingTopic] = useState('');
  const [trainingGoal, setTrainingGoal] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [trainingDays, setTrainingDays] = useState('');
  const [email, setEmail] = useState('');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const resetForm = useCallback(() => {
    setTrainingTopic('');
    setTrainingGoal('');
    setContactName('');
    setContactMobile('');
    setCompanyName('');
    setCompanyPhone('');
    setTrainingDays('');
    setEmail('');
    setRemark('');
    setError('');
  }, []);

  const handleSubmit = async () => {
    if (!trainingTopic || trainingTopic.length < 2) {
      setError('培训主题至少2个字符');
      return;
    }
    if (!contactName) {
      setError('请填写联系人姓名');
      return;
    }
    if (!contactMobile) {
      setError('请填写联系手机');
      return;
    }
    if (!companyName) {
      setError('请填写公司名称');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await submitTrainerMessage({
        trainerUserId,
        trainingTopic,
        trainingGoal: trainingGoal || undefined,
        contactName,
        contactMobile,
        companyName,
        companyPhone: companyPhone || undefined,
        trainingDays: trainingDays || undefined,
        email: email || undefined,
        remark: remark || undefined,
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
              value={trainingTopic}
              onChange={(e) => setTrainingTopic(e.target.value)}
              placeholder="请输入培训主题（2~30字）"
              maxLength={30}
            />
          </div>

          <div className="grid gap-1.5">
            <Label>培训目标</Label>
            <Textarea
              value={trainingGoal}
              onChange={(e) => setTrainingGoal(e.target.value)}
              placeholder="请输入培训目标（选填）"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>联系人 <span className="text-destructive">*</span></Label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="姓名"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>联系手机 <span className="text-destructive">*</span></Label>
              <Input
                value={contactMobile}
                onChange={(e) => setContactMobile(e.target.value)}
                placeholder="手机号码"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>公司名称 <span className="text-destructive">*</span></Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="公司名称"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>公司电话</Label>
              <Input
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="选填"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>培训天数</Label>
              <Input
                value={trainingDays}
                onChange={(e) => setTrainingDays(e.target.value)}
                placeholder="如：2天"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="选填"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>备注</Label>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
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
