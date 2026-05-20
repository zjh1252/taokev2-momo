'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { withdrawRole } from '@/features/user-center/api/service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/** 角色编码 → 中文标签 */
const ROLE_LABELS: Record<string, string> = {
  BUYER: '个人学员',
  ENTERPRISE_BUYER: '企业培训采购方',
  TRAINER: '专家',
  AGENT: '专家经纪人',
  ASSISTANT: '专家助理',
  ENTERPRISE_AGENT: '专家经纪公司',
  INSTITUTION: '培训机构',
  INSTITUTION_EMPLOYEE: '机构员工',
};

/**
 * 注销身份 — 仅非默认 BUYER 角色可单独注销
 *
 * <p>个人学员（BUYER）为默认角色，本页对其不展示「注销身份」入口（菜单层级也不暴露给学员）；
 * 学员需要走「注销账号」入口。其它已生效（status=1）的角色均可独立注销。</p>
 *
 * @author Fangxinxin
 * @date 2026-05-21 14:00
 */
export default function WithdrawRolePage() {
  const { user, refreshUser } = useAuth();

  const [dialog, setDialog] = useState<{ open: boolean; roleCode: string }>({
    open: false,
    roleCode: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // 可注销：所有 status=1 且非 BUYER 的角色
  const withdrawableRoles = (user?.roles || []).filter(
    (r) => r.status === 1 && r.role !== 'BUYER' && ROLE_LABELS[r.role],
  );

  const handleConfirm = async () => {
    const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
    if (!tokenData?.accessToken) return;
    setSubmitting(true);
    try {
      await withdrawRole(tokenData.accessToken, dialog.roleCode);
      toast.success(`已注销「${ROLE_LABELS[dialog.roleCode] || dialog.roleCode}」身份`);
      setDialog({ open: false, roleCode: '' });
      await refreshUser();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '注销失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      <div className="text-xl font-bold text-gray-900">注销身份</div>
      <div className="text-sm text-gray-500 mt-2">
        注销为不可恢复的硬删除操作。注销后将立即删除该角色对应的全部业务子表数据
        （档案、报价、签订协议等）和相关绑定关系。
      </div>

      {withdrawableRoles.length === 0 ? (
        <div className="mt-10 py-12 text-center text-sm text-gray-400">
          您当前没有可注销的非默认身份。
          <br />
          如需注销账号，请前往「我的账号 → 注销账号」。
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {withdrawableRoles.map((r) => (
            <div
              key={r.role}
              className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3"
            >
              <div className="text-sm text-gray-800">
                {ROLE_LABELS[r.role]}
                <span className="ml-2 text-xs text-gray-400">{r.role}</span>
              </div>
              <button
                type="button"
                onClick={() => setDialog({ open: true, roleCode: r.role })}
                className="text-xs px-3 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                注销该身份
              </button>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" />
              确认注销「{ROLE_LABELS[dialog.roleCode]}」身份
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2 text-sm text-gray-600">
              <p>注销后将立即硬删除：</p>
              <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
                <li>您的「{ROLE_LABELS[dialog.roleCode]}」角色记录</li>
                <li>对应业务表里的所有资料</li>
                <li>与该身份相关的全部绑定关系</li>
              </ul>
              <p className="text-red-600 font-medium">此操作不可恢复，请谨慎确认。</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialog({ open: false, roleCode: '' })}
              disabled={submitting}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
              {submitting ? '正在注销...' : '确认注销身份'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
