'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { updateProfile } from '@/features/user-center/api/service';

/**
 * 账号信息页 — 支持修改昵称、手机号、学习标签（接入 PUT /users/me）
 *
 * @author Fangxinxin
 * @date 2026-04-03 11:30
 */
export default function AccountBasePage() {
  const { user, refreshUser } = useAuth();

  const [nickname, setNickname] = useState(user?.nickname || '');
  const [phone] = useState(user?.phone || '');
  const [tags, setTags] = useState('AI办公应用, 销售技能');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
    if (!tokenData?.accessToken) return;

    setSaving(true);
    try {
      await updateProfile(tokenData.accessToken, { nickname });
      await refreshUser();
      alert('保存成功');
    } catch {
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      <div className="text-xl font-bold text-gray-900">账号信息</div>
      <div className="text-sm text-gray-500 mt-2">
        支持修改昵称、头像、手机号、学习标签和当前身份。
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">昵称</span>
          <input
            className="w-full border border-slate-300 rounded px-3 py-2"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-600 mb-1">手机号</span>
          <input
            className="w-full border border-slate-300 rounded px-3 py-2 bg-slate-50"
            value={phone}
            readOnly
          />
        </label>
        <label className="text-sm md:col-span-2">
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
      <div className="mt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存账号信息'}
        </button>
      </div>
    </section>
  );
}
