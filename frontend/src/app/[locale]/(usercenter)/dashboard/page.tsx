'use client';

import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/lib/auth/auth-context';
import {
  PlayCircle,
  Brain,
  Flame,
  Wrench,
  Target,
  Compass,
  Camera,
} from 'lucide-react';
import { useState } from 'react';

/** 设计稿中的 mock 课程 */
const RECENT_COURSES = [
  {
    id: 1,
    title: 'B2B大客户销售实战策略与控单技巧',
    instructor: '李云龙',
    audience: '销售人员',
    price: '¥ 199.00',
    progress: '已学 100%',
    tag: '录播课',
    tagClass: 'bg-black/60',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400&h=250',
  },
  {
    id: 2,
    title: '2024企业战略规划与绩效落地研修班',
    city: '上海',
    date: '04月15日',
    price: '面议',
    status: '报名成功',
    tag: '线下公开课',
    tagClass: 'bg-primary/90',
    image:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=400&h=250',
  },
];

/**
 * 用户中心 — 个人主页
 *
 * @author Fangxinxin
 * @date 2026-04-03 10:30
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'recent' | 'recommend'>('recent');

  const nickname = user?.nickname || '用户';
  const initials = nickname.slice(0, 2).toUpperCase();

  return (
    <>
      {/* 模块 1：欢迎与资产总览 */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-5">
          {/* 头像 */}
          <div className="relative group cursor-pointer">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={nickname}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover border-4 border-slate-50 shadow-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold border-4 border-slate-50 shadow-sm">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="size-5 text-white" />
            </div>
          </div>
          {/* 基础信息 */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">
                欢迎来到用户中心，{nickname}
              </h1>
              <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded text-xs font-bold flex items-center gap-1 shadow-sm">
                学员
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-slate-100 text-gray-600 rounded text-xs">
                AI办公应用
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-gray-600 rounded text-xs">
                销售技能
              </span>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-3">
              <span>学号：C{String(user?.id || 12).padStart(5, '0')}</span>
            </div>
          </div>
        </div>
        {/* 资产操作 */}
        <div className="lg:border-l border-slate-100 lg:pl-8 flex flex-col items-start lg:items-end w-full lg:w-auto">
          <div className="flex gap-12">
            <div className="flex flex-col items-center">
              <div className="text-sm text-gray-500 mb-1">消息</div>
              <div className="text-2xl font-bold text-primary font-mono">0</div>
            </div>
          </div>
        </div>
      </section>

      {/* 模块 2：快捷操作指南 */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-200 flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h2 className="font-bold text-gray-800">在淘课，你可以：</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 左半：继续学习 (录播课相关，写死) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <PlayCircle className="size-5" /> 继续学习
            </div>
            <div className="border border-red-100 bg-red-50/30 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group">
              <h3 className="font-medium text-gray-800 mb-3 group-hover:text-primary transition-colors truncate">
                《ChatGPT在企业办公中的高效应用与实战》
              </h3>
              {/* 进度条 */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                <div
                  className="bg-primary h-1.5 rounded-full relative"
                  style={{ width: '45%' }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-primary rounded-full shadow" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-500">
                  已学习 45% (第3节)
                </span>
                <button
                  type="button"
                  className="text-xs text-primary border border-primary px-3 py-1.5 rounded hover:bg-primary hover:text-white transition-colors"
                >
                  继续播放
                </button>
              </div>
            </div>
          </div>

          {/* 右半：工具与资源 */}
          <div className="flex flex-col justify-center gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 text-gray-500 font-medium text-sm text-right shrink-0">
                找好资源
              </div>
              <div className="flex-1 flex gap-3">
                <a
                  href="#"
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 border border-slate-200 py-2.5 rounded hover:text-primary hover:border-red-200 hover:bg-red-50/30 transition-all"
                >
                  <Brain className="size-[18px]" /> AI智能选课
                </a>
                <a
                  href="#"
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 border border-slate-200 py-2.5 rounded hover:text-primary hover:border-red-200 hover:bg-red-50/30 transition-all"
                >
                  <Flame className="size-[18px]" /> 行业热点课
                </a>
              </div>
            </div>
            <div className="w-full h-[1px] bg-slate-100" />
            <div className="flex items-center gap-4">
              <div className="w-16 text-gray-500 font-medium text-sm text-right shrink-0">
                用好工具
              </div>
              <div className="flex-1 flex gap-3">
                <a
                  href="#"
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 border border-slate-200 py-2.5 rounded hover:text-primary hover:border-red-200 hover:bg-red-50/30 transition-all"
                >
                  <Wrench className="size-[18px]" /> 培训宝
                </a>
                <a
                  href="#"
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 border border-slate-200 py-2.5 rounded hover:text-primary hover:border-red-200 hover:bg-red-50/30 transition-all"
                >
                  <Target className="size-[18px]" /> 目标通
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 模块 3：动态与推荐列表 */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 border-b border-slate-200 flex gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('recent')}
            className={`py-4 text-[15px] ${activeTab === 'recent' ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium hover:text-gray-800'}`}
          >
            最近学习
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recommend')}
            className={`py-4 text-[15px] ${activeTab === 'recommend' ? 'text-primary font-bold border-b-2 border-primary' : 'text-gray-500 font-medium hover:text-gray-800'}`}
          >
            智能推荐
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {RECENT_COURSES.map((course) => (
            <div
              key={course.id}
              className="group cursor-pointer border border-slate-100 rounded-lg overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="aspect-[16/10] bg-slate-800 relative overflow-hidden">
                <Image
                  src={course.image}
                  alt={course.title}
                  width={400}
                  height={250}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                />
                <div className={`absolute top-2 right-2 ${course.tagClass} backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded`}>
                  {course.tag}
                </div>
                {course.tag === '录播课' && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="size-10 text-white drop-shadow-md" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-primary transition-colors text-sm h-10">
                  {course.title}
                </h3>
                <div className="text-xs text-gray-500 mb-3">
                  {course.instructor
                    ? `讲师：${course.instructor} | 适用：${course.audience}`
                    : `开课城市：${course.city} | ${course.date}`}
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-primary font-bold">{course.price}</span>
                  {course.progress ? (
                    <span className="text-xs text-gray-400">
                      {course.progress}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-red-50 text-primary px-1.5 py-0.5 rounded border border-red-100">
                      {course.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 发现更多 */}
          <Link
            href={ROUTES.PUBLIC_COURSES}
            className="group cursor-pointer border border-slate-100 rounded-lg overflow-hidden flex flex-col items-center justify-center bg-slate-50 border-dashed border-2 text-gray-400 hover:text-primary hover:border-primary/50 hover:bg-red-50/20 min-h-[200px]"
          >
            <Compass className="size-10 mb-2 opacity-50" />
            <span className="text-sm font-medium">发现更多优质课程</span>
          </Link>
        </div>
      </section>
    </>
  );
}
