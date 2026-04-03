'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';
import { Search } from 'lucide-react';

type FavTab = 'course' | 'trainer' | 'org' | 'case';

const TABS: { key: FavTab; label: string }[] = [
  { key: 'course', label: '课程' },
  { key: 'trainer', label: '讲师' },
  { key: 'org', label: '机构' },
  { key: 'case', label: '案例' },
];

const INITIAL_FAVS: Record<FavTab, { id: number; title: string; sub1: string; sub2: string; image: string; round?: boolean }[]> = {
  course: [
    { id: 1, title: 'AI办公效率提升全景课', sub1: '讲师：刘晨 · 录播课', sub2: '¥299.00 · 2,354人学习', image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=220&h=140' },
    { id: 2, title: '高绩效团队管理实战', sub1: '讲师：赵明 · 录播课', sub2: '¥399.00 · 1,128人学习', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=220&h=140' },
  ],
  trainer: [
    { id: 10, title: '李老师 · 销售管理专家', sub1: '擅长：B2B销售、团队管理', sub2: '评分：4.9 · 成交：126', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=160&h=160', round: true },
  ],
  org: [
    { id: 20, title: '启航企业培训研究院', sub1: '机构类型：培训机构 · 所在地：上海', sub2: '', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=220&h=140' },
  ],
  case: [
    { id: 30, title: '某制造企业销售团队提效项目', sub1: '培训周期：3个月 · 结果：人均业绩 +18%', sub2: '', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=220&h=140' },
  ],
};

/**
 * 我的收藏 — 课程 / 讲师 / 机构 / 案例 tabs（全部写死）
 *
 * @author Fangxinxin
 * @date 2026-04-03 12:30
 */
export default function FavoritesPage() {
  const [tab, setTab] = useState<FavTab>('course');
  const [favs, setFavs] = useState(INITIAL_FAVS);

  const removeFav = useCallback((key: FavTab, id: number) => {
    setFavs((prev) => ({
      ...prev,
      [key]: prev[key].filter((f) => f.id !== id),
    }));
  }, []);

  const items = favs[tab];

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 border-b border-slate-200 flex justify-between items-center">
        <div className="flex gap-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`py-4 text-[15px] ${tab === t.key ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="输入关键字搜索"
            className="border border-slate-300 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48"
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 size-[18px] cursor-pointer hover:text-primary" />
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.length === 0 && (
          <div className="col-span-2 text-center text-gray-400 py-12">暂无收藏</div>
        )}
        {items.map((item) => (
          <div key={item.id} className="border border-slate-200 rounded-lg p-4 flex gap-3">
            <Image
              src={item.image}
              alt={item.title}
              width={item.round ? 76 : 120}
              height={76}
              className={`${item.round ? 'w-[76px] h-[76px] rounded-full' : 'w-[120px] h-[76px] rounded'} object-cover`}
            />
            <div className="flex-1">
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-gray-500 mt-1">{item.sub1}</div>
              {item.sub2 && <div className="text-xs text-gray-500 mt-1">{item.sub2}</div>}
            </div>
            <div className="mt-3 flex justify-end">
              {/* TODO: 接入取消收藏 API */}
              <button
                type="button"
                onClick={() => removeFav(tab, item.id)}
                className="text-xs border border-slate-200 rounded px-3 py-1 hover:text-primary hover:border-red-200 transition-colors"
              >
                取消收藏
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
