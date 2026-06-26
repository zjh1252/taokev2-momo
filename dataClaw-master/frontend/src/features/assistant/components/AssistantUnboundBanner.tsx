'use client';

import { Lock, UserPlus } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/**
 * 专家助理未绑定专家时的空态提示卡片 — 用于课程 / 案例 / 视频 / 著作 / 精彩瞬间
 * 等资源发布页顶部，引导助理先去「我的专家」绑定。
 *
 * @author Fangxinxin
 * @date 2026-04-22 16:00
 */
export function AssistantUnboundBanner() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-6">
      <div className="flex items-start gap-3">
        <div className="shrink-0 size-10 rounded-full bg-amber-100 flex items-center justify-center">
          <Lock className="size-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-amber-900">
            您还未绑定任何专家
          </h3>
          <p className="mt-1 text-sm text-amber-800/90">
            专家助理需在管理某位专家后才能为其代发资源。请先前往「我的专家」绑定一位专家后再回来发布。
          </p>
          <Link
            href="/dashboard/my-experts"
            className="inline-flex items-center gap-1.5 mt-4 rounded-lg bg-amber-600 hover:bg-amber-700 transition-colors px-4 py-2 text-sm font-medium text-white"
          >
            <UserPlus className="size-4" />
            去添加专家
          </Link>
        </div>
      </div>
    </div>
  );
}
