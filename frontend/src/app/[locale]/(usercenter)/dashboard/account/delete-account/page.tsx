'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { ROUTES } from '@/config/routes';
import { deleteOwnAccount } from '@/features/user-center/api/service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

/**
 * 注销账号 — 硬删除当前用户全部数据库记录
 *
 * <p>所有角色用户均可访问此页面。学员（BUYER）由于无法单独注销身份，
 * 本入口是其唯一的注销路径。</p>
 *
 * @author Fangxinxin
 * @date 2026-05-21 14:00
 */
export default function DeleteAccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
    if (!tokenData?.accessToken) return;
    setSubmitting(true);
    try {
      await deleteOwnAccount(tokenData.accessToken);
      toast.success('账号已注销');
      setDialogOpen(false);
      logout();
      router.push(ROUTES.LOGIN);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '注销失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      <div className="text-xl font-bold text-gray-900">注销账号</div>
      <div className="text-sm text-gray-500 mt-2">
        注销账号是不可恢复的硬删除操作。我们建议您在注销前先确认这些事项：
      </div>

      <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
        <li>账号下的全部角色身份（专家、经纪人、机构等）将被一并删除。</li>
        <li>所有绑定关系（经纪人 ↔ 专家、机构 ↔ 员工等）也将被解除。</li>
      </ul>

      <div className="mt-6 border border-red-200 bg-red-50/40 rounded-lg px-4 py-3">
        <div className="text-sm text-gray-700">
          当前账号：<span className="font-medium">{user?.nickname || '—'}</span>
          {user?.phone && <span className="ml-2 text-gray-400">{user.phone}</span>}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          点击下方按钮注销该账号，操作完成后将自动跳转到登录页。
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="mt-3 text-sm px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
        >
          注销账号
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="size-5" />
              确认注销整个账号
            </DialogTitle>
            <DialogDescription className="pt-2 space-y-2 text-sm text-gray-600">
              <p>注销后将立即硬删除：</p>
              <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
                <li>账号基本信息（昵称、头像、手机号等）</li>
                <li>全部角色身份与对应业务子表数据</li>
                <li>全部绑定关系（经纪人、助理、机构、机构员工等）</li>
              </ul>
              <p className="text-red-600 font-medium">
                此操作不可恢复，请谨慎确认。
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
              {submitting ? '正在注销...' : '确认注销账号'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
