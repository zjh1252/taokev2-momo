'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { changePassword } from '@/features/user-center/api/service';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

/**
 * 修改密码页 — 独立菜单页面
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
export default function AccountPasswordPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');

    if (!newPassword) {
      setError('请输入新密码');
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 32) {
      setError('密码长度为6-32位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
    if (!tokenData?.accessToken) {
      setError('登录状态异常，请重新登录');
      return;
    }

    setSaving(true);
    try {
      await changePassword(tokenData.accessToken, {
        oldPassword: oldPassword || undefined,
        newPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('密码修改成功');
    } catch {
      setError('密码修改失败，请检查旧密码是否正确');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      <div className="mb-6">
        <div className="text-xl font-bold text-gray-900">修改密码</div>
        <div className="text-sm text-gray-500 mt-2">
          为了账户安全，请定期修改密码。如未设置过密码（如手机号一键注册），旧密码可留空。
        </div>
      </div>

      <div className="grid gap-4 max-w-md">
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="old-password">旧密码</Label>
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-xs text-primary hover:underline"
            >
              忘记密码？通过手机验证码重置
            </Link>
          </div>
          <Input
            id="old-password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="如从未设置过密码可留空"
            autoComplete="current-password"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="new-password">新密码</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="6-32位字符"
            autoComplete="new-password"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirm-password">确认新密码</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="再次输入新密码"
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <div className="pt-2">
          <Button onClick={handleSave} disabled={saving} className="font-bold">
            {saving ? '保存中...' : '保存修改'}
          </Button>
        </div>
      </div>
    </section>
  );
}
