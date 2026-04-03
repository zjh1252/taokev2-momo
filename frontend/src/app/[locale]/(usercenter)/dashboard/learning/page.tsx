'use client';

import Image from 'next/image';
import { useState } from 'react';

const ONLINE_COURSES = [
  {
    id: 1,
    title: 'B2B大客户销售实战策略与控单技巧',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400&h=250',
    progress: 45,
    statusTag: '有效期内',
    tagColor: 'bg-green-500/90',
    btnText: '继续学习',
    btnStyle: 'bg-primary hover:bg-primary/90 text-white',
    barColor: 'bg-primary',
  },
  {
    id: 2,
    title: '销售团队管理中的过程辅导与复盘机制',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=400&h=250',
    progress: 78,
    statusTag: '即将到期',
    tagColor: 'bg-amber-500/90',
    btnText: '继续学习',
    btnStyle: 'border border-primary text-primary hover:bg-red-50',
    barColor: 'bg-primary',
  },
  {
    id: 3,
    title: 'AI办公协作实战：流程自动化与效率提升',
    image: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=400&h=250',
    progress: 100,
    statusTag: '已完成',
    tagColor: 'bg-slate-800/80',
    btnText: '查看笔记',
    btnStyle: 'border border-slate-300 text-gray-700 hover:bg-slate-50',
    barColor: 'bg-emerald-500',
  },
];

const OFFLINE_COURSES = [
  {
    id: 10,
    title: '企业战略规划与执行落地公开课',
    image: 'https://images.unsplash.com/photo-1560439514-4e9645039924?auto=format&fit=crop&q=80&w=220&h=140',
    city: '上海',
    date: '2026-04-15',
    status: '待开课',
    instructor: '王海峰',
    enrollNo: 'ENR20260415001',
    btnText: '查看会务通知',
  },
  {
    id: 11,
    title: '管理者沟通与跨部门协作实训营',
    image: 'https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&q=80&w=220&h=140',
    city: '杭州',
    date: '2026-03-12',
    status: '已完结',
    instructor: '赵彬',
    enrollNo: 'ENR20260312003',
    btnText: '去评价',
  },
];

/**
 * 我的学习 — 录播课 / 公开课 tabs（全部写死，录播课功能未实现）
 *
 * @author Fangxinxin
 * @date 2026-04-03 12:00
 */
export default function LearningPage() {
  const [tab, setTab] = useState<'online' | 'offline'>('online');

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 border-b border-slate-200 flex gap-8">
        <button
          type="button"
          onClick={() => setTab('online')}
          className={`py-4 text-[15px] ${tab === 'online' ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium'}`}
        >
          录播课
        </button>
        <button
          type="button"
          onClick={() => setTab('offline')}
          className={`py-4 text-[15px] ${tab === 'offline' ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium'}`}
        >
          公开课
        </button>
      </div>

      {/* 录播课 */}
      {tab === 'online' && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {ONLINE_COURSES.map((c) => (
            <div key={c.id} className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-[16/10] bg-slate-100 relative">
                <Image src={c.image} alt={c.title} width={400} height={250} className="w-full h-full object-cover" />
                <div className={`absolute top-2 left-2 ${c.tagColor} text-white text-[10px] px-2 py-1 rounded`}>
                  {c.statusTag}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-800 line-clamp-2 mb-3 text-sm h-10">{c.title}</h3>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                  <div className={`${c.barColor} h-1.5 rounded-full`} style={{ width: `${c.progress}%` }} />
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-gray-500">已学习 {c.progress}%</span>
                </div>
                {/* TODO: 接入录播课播放 */}
                <button type="button" className={`w-full text-sm py-2 rounded transition-colors ${c.btnStyle}`}>
                  {c.btnText}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 公开课 */}
      {tab === 'offline' && (
        <div className="p-6 space-y-4">
          {OFFLINE_COURSES.map((c) => (
            <div key={c.id} className="border border-slate-200 rounded-lg p-4 flex items-center gap-4">
              <Image src={c.image} alt={c.title} width={160} height={96} className="w-[160px] h-[96px] rounded object-cover" />
              <div className="flex-1">
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-gray-500 mt-1">{c.city} · {c.date} · 状态：{c.status}</div>
                <div className="text-xs text-gray-500 mt-1">讲师：{c.instructor} · 报名编号：{c.enrollNo}</div>
              </div>
              <button
                type="button"
                className={`text-xs px-3 py-1.5 rounded ${c.status === '已完结' ? 'bg-primary text-white' : 'border border-primary text-primary hover:bg-red-50'}`}
              >
                {c.btnText}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
