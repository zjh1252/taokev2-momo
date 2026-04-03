'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Search } from 'lucide-react';

type OrderTab = 'all' | 'pending' | 'done' | 'expired';

/**
 * 我的订单 — 全部订单 / 待支付 / 已完成 / 已过期 tabs（全部写死）
 *
 * @author Fangxinxin
 * @date 2026-04-03 12:00
 */
export default function OrdersPage() {
  const [tab, setTab] = useState<OrderTab>('all');
  const [search, setSearch] = useState('');

  const tabs: { key: OrderTab; label: string; badge?: string }[] = [
    { key: 'all', label: '全部订单' },
    { key: 'pending', label: '待支付', badge: '1' },
    { key: 'done', label: '已完成' },
    { key: 'expired', label: '已过期' },
  ];

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 border-b border-slate-200 flex justify-between items-center">
        <div className="flex gap-8">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`py-4 text-[15px] ${tab === t.key ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium'}`}
            >
              {t.label}
              {t.badge && (
                <span className="text-primary text-xs ml-1">{t.badge}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="输入订单号搜索"
            className="border border-slate-300 rounded-md pl-3 pr-8 py-1.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-48"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 size-[18px] cursor-pointer hover:text-primary" />
        </div>
      </div>

      {/* 全部订单 & 待支付 */}
      {(tab === 'all' || tab === 'pending') && (
        <div className="p-6 flex flex-col gap-4">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center text-sm">
              <div className="text-gray-500">
                订单号：TK20240410001 <span className="mx-2">|</span> 2024-04-10 14:30
              </div>
              <div className="text-primary font-medium">待支付</div>
            </div>
            <div className="p-4 flex items-center gap-4">
              <Image
                src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=120&h=80"
                alt="Course"
                width={120}
                height={80}
                className="w-[120px] h-[80px] object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 mb-1">
                  2024企业战略规划与绩效落地研修班
                </h3>
                <div className="text-xs text-gray-500">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded mr-2">线下公开课</span>
                  单价：¥3,980.00 x 1
                </div>
              </div>
              <div className="text-right border-l border-slate-100 pl-6 ml-6 min-w-[150px]">
                <div className="text-xs text-gray-500 mb-1">实付款</div>
                <div className="text-xl font-bold text-gray-900 mb-3">¥ 3,980.00</div>
                <div className="flex flex-col gap-2">
                  {/* TODO: 接入支付 */}
                  <button type="button" className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded text-sm transition-colors">
                    立即支付
                  </button>
                  <button type="button" className="text-gray-500 hover:text-gray-800 text-xs">
                    取消订单
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 已完成 */}
      {tab === 'done' && (
        <div className="p-6">
          <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">AI办公效率提升全景课</div>
              <div className="text-xs text-gray-500 mt-1">订单号：TK20240302008 · 已完成</div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="text-xs border border-slate-300 rounded px-3 py-1.5 hover:border-primary hover:text-primary transition-colors">
                查看发票
              </button>
              <button type="button" className="text-xs border border-primary text-primary rounded px-3 py-1.5 hover:bg-red-50 transition-colors">
                去学习
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 已过期 */}
      {tab === 'expired' && (
        <div className="p-6">
          <div className="border border-slate-200 rounded-lg p-4">
            <div className="font-medium">企业战略规划公开课（已过期）</div>
            <div className="text-xs text-gray-500 mt-1">
              订单号：TK20240211003 · 过期原因：超时未支付
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
