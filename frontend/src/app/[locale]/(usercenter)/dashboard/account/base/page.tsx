'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { updateProfile, changePassword } from '@/features/user-center/api/service';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

function getAuthToken(): string {
  const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
  return tokenData?.accessToken || '';
}

async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const resp = await fetch(`${API_BASE_URL}/uploads/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: formData,
  });
  if (!resp.ok) throw new Error('上传失败');
  const json = await resp.json() as { data: { url: string } };
  return json.data.url;
}

export default function AccountBasePage() {
  const { user, refreshUser } = useAuth();

  // 基本资料状态
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [phone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [tags, setTags] = useState('AI办公应用, 销售技能');
  const [savingProfile, setSavingProfile] = useState(false);

  // 头像上传状态
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 密码修改状态
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
    } catch {
      alert('头像上传失败，请重试');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
    if (!tokenData?.accessToken) return;

    setSavingProfile(true);
    try {
      await updateProfile(tokenData.accessToken, { nickname, avatarUrl });
      await refreshUser();
      alert('保存成功');
    } catch {
      alert('保存失败，请重试');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordError('');

    if (!newPassword) {
      setPasswordError('请输入新密码');
      return;
    }
    if (newPassword.length < 6 || newPassword.length > 32) {
      setPasswordError('密码长度为6-32位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }

    const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
    if (!tokenData?.accessToken) return;

    setSavingPassword(true);
    try {
      await changePassword(tokenData.accessToken, {
        oldPassword: oldPassword || undefined,
        newPassword,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordDialogOpen(false);
      alert('密码修改成功');
    } catch {
      setPasswordError('密码修改失败，请检查旧密码是否正确');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xl font-bold text-gray-900">账号信息</div>
            <div className="text-sm text-gray-500 mt-2">
              支持修改昵称、头像、手机号、学习标签和当前身份。
            </div>
          </div>

          {/* 头像上传 */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="头像"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <span className="text-2xl font-bold">{user?.nickname?.[0] || '?'}</span>
                  </div>
                )}
              </div>
              {/* 上传按钮 */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="size-5 text-white animate-spin" />
                ) : (
                  <Camera className="size-5 text-white" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">点击更换头像</p>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <label className="text-sm block">
            <span className="block text-gray-600 mb-1">昵称</span>
            <input
              className="w-full border border-slate-300 rounded px-3 py-2"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>
          <label className="text-sm block">
            <span className="block text-gray-600 mb-1">手机号</span>
            <input
              className="w-full border border-slate-300 rounded px-3 py-2 bg-slate-50"
              value={phone}
              readOnly
            />
          </label>
          <label className="text-sm md:col-span-2 block">
            <span className="block text-gray-600 mb-1">学习标签</span>
            <input
              className="w-full border border-slate-300 rounded px-3 py-2"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="多个标签用逗号分隔"
            />
            {/* TODO: 学习标签功能待后端支持 */}
          </label>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-6 items-start">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="bg-primary text-white px-6 py-3 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors font-bold"
          >
            {savingProfile ? '保存中...' : '保存账号信息'}
          </button>

          {/* 修改密码按钮 */}
          <button
            type="button"
            onClick={() => setPasswordDialogOpen(true)}
            className="border border-slate-300 text-slate-700 px-6 py-3 rounded hover:bg-slate-50 transition-colors font-medium"
          >
            修改密码
          </button>
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>修改密码</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-1.5">
                  <Label>旧密码</Label>
                  <Input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="如从未设置过密码可留空"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>新密码</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6-32位字符"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>确认新密码</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码"
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                    setPasswordDialogOpen(false);
                  }}
                >
                  取消
                </Button>
                <Button onClick={handleSavePassword} disabled={savingPassword}>
                  {savingPassword ? '保存中...' : '确认修改'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </>
  );
}
