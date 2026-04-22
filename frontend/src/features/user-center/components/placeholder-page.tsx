'use client';

import { Sparkles } from 'lucide-react';

/**
 * 功能占位页 — 尚未实现的菜单对应的临时页面
 *
 * @author Fangxinxin
 * @date 2026-04-16 15:00
 */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] flex items-center justify-center">
      <div className="text-center py-20">
        <div className="flex items-center justify-center size-16 rounded-full bg-amber-50 mx-auto mb-4">
          <Sparkles className="size-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500">功能开发中，敬请期待</p>
      </div>
    </section>
  );
}
