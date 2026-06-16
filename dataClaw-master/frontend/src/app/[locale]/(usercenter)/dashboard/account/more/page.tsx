'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth/auth-context';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { updateProfile } from '@/features/user-center/api/service';

/**
 * 更多信息页 — 个人学员的学习标签维护
 *
 * <p>学习标签以逗号分隔的字符串形式存储，未来用于课程/讲师推荐。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-16 16:30
 */
export default function AccountMorePage() {
  const { user, refreshUser } = useAuth();

  const [studyTags, setStudyTags] = useState(user?.studyTags || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
    if (!tokenData?.accessToken) return;

    setSaving(true);
    try {
      await updateProfile(tokenData.accessToken, { studyTags });
      await refreshUser();
      toast.success('学习标签保存成功');
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 把逗号分隔字符串渲染成 chip 预览
  const tagList = studyTags
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      <div>
        <div className="text-xl font-bold text-gray-900">更多信息</div>
        <div className="text-sm text-gray-500 mt-2">
          填写您感兴趣的学习方向，我们将根据这些标签为您推荐合适的课程与讲师。
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <label className="text-sm block">
          <span className="block text-gray-600 mb-1">学习标签</span>
          <textarea
            className="w-full border border-slate-300 rounded px-3 py-2 min-h-[88px]"
            value={studyTags}
            onChange={(e) => setStudyTags(e.target.value)}
            placeholder="多个标签使用逗号分隔，例如：AI办公应用, 销售技能, 演讲表达"
          />
        </label>

        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tagList.map((t) => (
              <span
                key={t}
                className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-white px-6 py-3 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors font-bold"
        >
          {saving ? '保存中...' : '保存学习标签'}
        </button>
      </div>
    </section>
  );
}
