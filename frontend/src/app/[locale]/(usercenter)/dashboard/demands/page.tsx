'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

const DEMANDS = [
  {
    id: 1,
    title: '寻找资深的高级销售培训讲师',
    desc: '我们需要一位在IT行业有10年以上销售管理经验的讲师，针对我们的销售团队进行为期2天的内训。重点在于大客户销售技巧和客情关系维护...',
    status: '处理中',
    statusCls: 'bg-blue-50 text-blue-600 border-blue-100',
    budget: '10,000 - 20,000元',
    budgetCls: 'text-primary font-medium',
    date: '2024-03-25',
    canEdit: true,
  },
  {
    id: 2,
    title: '企业中层管理能力提升内训',
    desc: '针对公司新晋升的20名中层干部，需要提升他们的团队管理、目标拆解和跨部门沟通能力。已与平台客服沟通确认方案。',
    status: '已完成',
    statusCls: 'bg-green-50 text-green-600 border-green-100',
    budget: '面议',
    budgetCls: 'text-gray-800 font-medium',
    date: '2024-02-10',
    canEdit: false,
  },
];

/**
 * 我的需求 — 需求列表 + 发布按钮（全部写死）
 *
 * @author Fangxinxin
 * @date 2026-04-03 12:00
 */
export default function DemandsPage() {
  const [filter, setFilter] = useState<'all' | 'processing' | 'done'>('all');
  const filtered =
    filter === 'all'
      ? DEMANDS
      : DEMANDS.filter((d) =>
          filter === 'processing' ? d.status === '处理中' : d.status === '已完成',
        );

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-bold text-gray-800">我的需求</h2>
        {/* TODO: 接入发布需求 */}
        <button
          type="button"
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded text-sm transition-colors flex items-center gap-1"
        >
          <Plus className="size-4" />
          发布新需求
        </button>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6 text-sm">
          {(['all', 'processing', 'done'] as const).map((key, i) => {
            const labels = { all: `全部需求 (${DEMANDS.length})`, processing: `处理中 (${DEMANDS.filter((d) => d.status === '处理中').length})`, done: `已完成 (${DEMANDS.filter((d) => d.status === '已完成').length})` };
            return (
              <span key={key} className="flex items-center gap-4">
                {i > 0 && <span className="text-gray-300">|</span>}
                <button
                  type="button"
                  onClick={() => setFilter(key)}
                  className={filter === key ? 'text-primary font-bold' : 'text-gray-500 hover:text-primary'}
                >
                  {labels[key]}
                </button>
              </span>
            );
          })}
        </div>

        <div className="space-y-4">
          {filtered.map((d) => (
            <div key={d.id} className={`border border-slate-200 rounded-lg p-4 hover:border-primary/30 transition-colors ${d.status === '已完成' ? 'bg-slate-50/50' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-[15px]">{d.title}</h3>
                <span className={`px-2 py-0.5 border rounded text-xs ${d.statusCls}`}>
                  {d.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{d.desc}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex gap-4">
                  <span>预算：<span className={d.budgetCls}>{d.budget}</span></span>
                  <span>发布时间：{d.date}</span>
                </div>
                <div className="flex gap-3">
                  <button type="button" className="text-gray-500 hover:text-primary">查看详情</button>
                  {d.canEdit && <button type="button" className="text-gray-500 hover:text-primary">修改需求</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
