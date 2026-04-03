'use client';

import { useState } from 'react';

/**
 * 我的点评 — 我的评价 / 待评价 tabs（全部写死）
 *
 * @author Fangxinxin
 * @date 2026-04-03 12:30
 */
export default function ReviewsPage() {
  const [tab, setTab] = useState<'mine' | 'pending'>('mine');

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 border-b border-slate-200 flex gap-8">
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`py-4 text-[15px] ${tab === 'mine' ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium'}`}
        >
          我的评价
        </button>
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`py-4 text-[15px] ${tab === 'pending' ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium'}`}
        >
          待评价
        </button>
      </div>

      {tab === 'mine' && (
        <div className="p-6 space-y-4">
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">
              课程：B2B大客户销售实战策略与控单技巧
            </div>
            <div className="text-primary mt-1">★★★★★</div>
            <div className="text-sm mt-2">内容实操性很强，课程结构清晰。</div>
            <div className="text-xs text-gray-500 mt-2">
              讲师回复：感谢认可，欢迎继续学习进阶课程。
            </div>
          </div>
        </div>
      )}

      {tab === 'pending' && (
        <div className="p-6 space-y-4">
          <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-700">
                课程：高绩效团队管理实战
              </div>
              <div className="text-xs text-gray-500 mt-1">
                已完成学习，待提交评价
              </div>
            </div>
            {/* TODO: 接入评价 API */}
            <button
              type="button"
              className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90 transition-colors"
            >
              去评价
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
