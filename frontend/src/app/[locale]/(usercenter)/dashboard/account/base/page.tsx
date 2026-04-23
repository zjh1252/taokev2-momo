'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { updateProfile } from '@/features/user-center/api/service';

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

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [realName, setRealName] = useState(user?.realName || '');
  const [phone] = useState(user?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
      toast.success('头像上传成功');
    } catch {
      toast.error('头像上传失败，请重试');
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
      await updateProfile(tokenData.accessToken, { nickname, realName, avatarUrl });
      await refreshUser();
      toast.success('基础信息保存成功');
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xl font-bold text-gray-900">基础信息</div>
          <div className="text-sm text-gray-500 mt-2">
            支持修改昵称、真实姓名、头像。手机号为注册号码，不可修改。
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
            placeholder="请输入昵称"
          />
        </label>
        <label className="text-sm block">
          <span className="block text-gray-600 mb-1">真实姓名</span>
          <input
            className="w-full border border-slate-300 rounded px-3 py-2"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="请输入真实姓名"
          />
        </label>
        <label className="text-sm md:col-span-2 block">
          <span className="block text-gray-600 mb-1">手机号</span>
          <input
            className="w-full border border-slate-300 rounded px-3 py-2 bg-slate-50"
            value={phone}
            readOnly
          />
        </label>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="bg-primary text-white px-6 py-3 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors font-bold"
        >
          {savingProfile ? '保存中...' : '保存基础信息'}
        </button>
      </div>
    </section>
  );
}
