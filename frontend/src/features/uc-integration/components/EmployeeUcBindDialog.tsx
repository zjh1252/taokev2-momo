'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Search, X } from 'lucide-react';
import {
  bindEmployeeUcMember,
  getUcIdentityField,
  syncUcMemberProfile,
  unbindEmployeeUcMember,
} from '../api/service';
import type { UcIdentityField, UcOrgType } from '../api/types';
import type { UcMemberBrief } from '@/features/binding/api/types';

interface EmployeeUcBindDialogProps {
  orgType: UcOrgType;
  bindingId: number;
  employeeName: string;
  ucMember?: UcMemberBrief | null;
  onClose: () => void;
  onDone: () => void;
}

/**
 * 员工 UC 成员绑定 / 重新绑定 / 解绑对话框。
 */
export function EmployeeUcBindDialog({
  orgType,
  bindingId,
  employeeName,
  ucMember,
  onClose,
  onDone,
}: EmployeeUcBindDialogProps) {
  const [identityField, setIdentityField] = useState<UcIdentityField | null>(null);
  const [identityValue, setIdentityValue] = useState(ucMember?.identityValue || '');
  const [loadingField, setLoadingField] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingField(true);
      try {
        const field = await getUcIdentityField(orgType);
        setIdentityField(field);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'UC 组织自动关联失败');
        onClose();
      } finally {
        setLoadingField(false);
      }
    })();
  }, [orgType, onClose]);

  const handleBind = async () => {
    if (!identityValue.trim()) {
      toast.error(identityField?.placeholder || '请输入身份标识');
      return;
    }
    setSubmitting(true);
    try {
      const linked = await bindEmployeeUcMember(orgType, bindingId, identityValue.trim());
      toast.success(ucMember ? 'UC 成员已重新绑定' : 'UC 成员绑定成功');
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '绑定失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnbind = async () => {
    if (!confirm(`确定解除「${employeeName}」的 UC 成员绑定吗？`)) return;
    setUnlinking(true);
    try {
      await unbindEmployeeUcMember(orgType, bindingId);
      toast.success('已解除 UC 成员绑定');
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '解绑失败');
    } finally {
      setUnlinking(false);
    }
  };

  const handleSyncProfile = async () => {
    if (!ucMember?.memberLinkId) return;
    setSyncing(true);
    try {
      const data = await syncUcMemberProfile(orgType, ucMember.memberLinkId);
      setProfile(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '拉取详情失败');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">
            {ucMember ? 'UC 成员重新绑定' : '绑定 UC 成员'} · {employeeName}
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="size-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {loadingField ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="size-4 animate-spin" />
              加载配置…
            </div>
          ) : (
            <>
              {ucMember && (
                <div className="text-xs text-gray-600 bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                  <div>当前 UC：p_stu_id={ucMember.pStuId ?? '—'} · {ucMember.identityValue}</div>
                  {ucMember.memberLinkId && (
                    <button
                      type="button"
                      onClick={handleSyncProfile}
                      disabled={syncing}
                      className="text-primary hover:underline"
                    >
                      {syncing ? '拉取中…' : '查看 UC 成员详情'}
                    </button>
                  )}
                  {profile && (
                    <pre className="mt-2 max-h-32 overflow-auto text-[11px] bg-white border rounded p-2 whitespace-pre-wrap">
                      {JSON.stringify(profile, null, 2)}
                    </pre>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  {identityField?.fieldLabel || '身份标识'}
                </label>
                <input
                  value={identityValue}
                  onChange={(e) => setIdentityValue(e.target.value)}
                  placeholder={identityField?.placeholder}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-between gap-2">
          <div>
            {ucMember && (
              <button
                type="button"
                onClick={handleUnbind}
                disabled={unlinking}
                className="inline-flex items-center gap-1 text-sm text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                {unlinking && <Loader2 className="size-4 animate-spin" />}
                解绑 UC
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="button"
              disabled={submitting || loadingField}
              onClick={handleBind}
              className="inline-flex items-center gap-1 bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {ucMember ? '重新绑定' : '绑定'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
