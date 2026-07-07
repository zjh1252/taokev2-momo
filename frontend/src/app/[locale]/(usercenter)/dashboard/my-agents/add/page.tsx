'use client';

import { useState } from 'react';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  initiateBinding,
  lookupUserByPhone,
  type LookupUserResult,
} from '@/features/binding/api/service';
import type { BindingType } from '@/features/binding/api/types';
import { Link, useRouter } from '@/i18n/navigation';

const ROLE_OPTIONS: { value: BindingType; label: string }[] = [
  { value: 'ASSISTANT_TRAINER', label: '专家助理' },
  { value: 'AGENT_TRAINER', label: '专家经纪人' },
  { value: 'ENTERPRISE_AGENT_TRAINER', label: '专家经纪公司' },
  { value: 'INSTITUTION_TRAINER', label: '机构' },
  { value: 'INSTITUTION_EMPLOYEE', label: '机构员工' },
];

export default function AddAgentPage() {
  const router = useRouter();
  const [bindingType, setBindingType] = useState<BindingType>('ASSISTANT_TRAINER');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [target, setTarget] = useState<LookupUserResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLookup = async () => {
    const value = phone.trim();
    if (!value) {
      toast.error('请输入手机号');
      return;
    }
    setLoading(true);
    try {
      const result = await lookupUserByPhone(value);
      setTarget(result);
    } catch {
      setTarget(null);
      toast.error('未找到该用户');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!target) {
      toast.error('请先查找要绑定的用户');
      return;
    }
    setSubmitting(true);
    try {
      await initiateBinding({
        bindingType,
        targetUserId: target.id,
        note: note.trim() || undefined,
      });
      toast.success('绑定申请已发送，等待对方确认');
      router.push('/dashboard/my-agents');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发送绑定申请失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <Link
        href="/dashboard/my-agents"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        返回我的代理
      </Link>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800">添加代理</h2>
        <div className="mt-6 space-y-5 max-w-xl">
          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-2">代理类型</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBindingType(option.value)}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    bindingType === option.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 text-gray-600 hover:border-primary/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-2">对方手机号</label>
            <div className="flex gap-2">
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setTarget(null);
                }}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="请输入对方注册手机号"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                查找
              </button>
            </div>
          </fieldset>

          {target && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-gray-700">
              已找到用户：{target.nickname || `用户#${target.id}`}
              {target.phone && <span className="ml-2 text-gray-400">{target.phone}</span>}
            </div>
          )}

          <fieldset>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="可填写合作说明，便于对方确认"
            />
          </fieldset>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            发送绑定申请
          </button>
        </div>
      </div>
    </section>
  );
}
