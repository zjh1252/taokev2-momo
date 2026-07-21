'use client';

import Image from 'next/image';
import { Link, useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { UserAvatar } from '@/components/user-avatar';
import { useAuth } from '@/lib/auth/auth-context';
import {
  PlayCircle,
  Brain,
  Flame,
  Wrench,
  Target,
  Compass,
  Camera,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { getContinueLearning, getMyVideoLearnings } from '@/features/learning/api/service';
import { getUnreadCount } from '@/features/notification/api/service';
import type { ContinueLearning, MyVideoLearning } from '@/features/learning/api/types';
import { getVideoDetail } from '@/features/video/api/service';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { cn } from '@/lib/utils';
import { CustomerServiceChatDialog } from '@/components/customer-service-chat-dialog';

const ROLE_LABELS: Record<string, string> = {
  BUYER: '学员',
  INDIVIDUAL_BUYER: '学员',
  ENTERPRISE_BUYER: '企业采购方',
  TRAINER: '专家',
  AGENT: '专家经纪人',
  ASSISTANT: '专家助理',
  ENTERPRISE_AGENT: '专家经纪公司',
  INSTITUTION: '培训机构',
  INSTITUTION_EMPLOYEE: '机构员工',
};

const PLATFORM_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

interface VideoCategoryLinkSource {
  categoryId?: number | null;
  categoryName?: string | null;
}

function buildIndustryHotVideoHref(video?: VideoCategoryLinkSource | null) {
  const params = new URLSearchParams();
  if (video?.categoryId) {
    params.set('categoryId', String(video.categoryId));
  }
  if (video?.categoryName) {
    params.set('categoryName', video.categoryName);
  }
  params.set('sortBy', 'viewCount');
  return `${ROUTES.ONLINE_COURSES}?${params.toString()}`;
}

/**
 * 用户中心 — 个人主页
 *
 * @author Fangxinxin
 * @date 2026-04-03 10:30
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, activeRole, setActiveRole, trainerCode } = useAuth();
  const [activeTab, setActiveTab] = useState<'recent' | 'recommend'>('recent');
  const [switchTarget, setSwitchTarget] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [hotVideoCategory, setHotVideoCategory] = useState<VideoCategoryLinkSource | null>(null);

  const [continueLearning, setContinueLearning] = useState<ContinueLearning | null>(null);
  const [continueLoading, setContinueLoading] = useState(true);

  const [recentVideos, setRecentVideos] = useState<MyVideoLearning[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
    if (!tokenData?.accessToken) return;
    try {
      const res = await getUnreadCount(tokenData.accessToken);
      setUnreadMsgCount(res.data ?? 0);
    } catch {
      // 静默处理
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(fetchUnreadCount);
  }, [fetchUnreadCount]);

  useEffect(() => {
    getContinueLearning()
      .then((video) => {
        setContinueLearning(video);
        setHotVideoCategory(video);
      })
      .catch(() => setContinueLearning(null))
      .finally(() => setContinueLoading(false));

    getMyVideoLearnings(1, 3)
      .then((res) => setRecentVideos(res.list))
      .catch(() => setRecentVideos([]))
      .finally(() => setRecentLoading(false));
  }, []);

  useEffect(() => {
    if (!continueLearning || hotVideoCategory?.categoryId || hotVideoCategory?.categoryName) {
      return;
    }
    let cancelled = false;
    getVideoDetail(continueLearning.videoId)
      .then((detail) => {
        if (cancelled) return;
        setHotVideoCategory({
          categoryId: detail.categoryId,
          categoryName: detail.categoryName,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [continueLearning, hotVideoCategory]);

  const nickname = user?.nickname || '用户';
  const industryHotVideoHref = buildIndustryHotVideoHref(hotVideoCategory);

  const handleIndustryHotVideoClick = useCallback(
    async (event: MouseEvent<HTMLAnchorElement>) => {
      if (!continueLearning || hotVideoCategory?.categoryId || hotVideoCategory?.categoryName) {
        return;
      }
      event.preventDefault();
      try {
        const detail = await getVideoDetail(continueLearning.videoId);
        const category = {
          categoryId: detail.categoryId,
          categoryName: detail.categoryName,
        };
        setHotVideoCategory(category);
        router.push(buildIndustryHotVideoHref(category));
      } catch {
        router.push(buildIndustryHotVideoHref(null));
      }
    },
    [continueLearning, hotVideoCategory, router],
  );

  return (
    <>
      {/* 模块 1：欢迎与资产总览 */}
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-5">
          {/* 头像 — 点击进入「个人资料」编辑页 */}
          <Link
            href="/dashboard/account/base"
            className="relative group cursor-pointer flex size-20 shrink-0 overflow-hidden rounded-full border-4 border-slate-50 shadow-sm"
            title="编辑个人资料"
          >
            <UserAvatar
              src={user?.avatarUrl}
              name={nickname}
              size={80}
              className="size-full border-0 shadow-none"
            />
            <div className="absolute inset-0 z-20 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="size-5 text-white" />
            </div>
          </Link>
          {/* 基础信息 */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-gray-900">
                欢迎来到用户中心，{nickname}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5">
                {/* 学员标签（默认角色） */}
                <button
                  type="button"
                  onClick={() => activeRole !== 'BUYER' && setSwitchTarget('BUYER')}
                  className={cn(
                    'relative px-2.5 py-0.5 rounded text-xs font-bold shadow-sm transition-all cursor-pointer',
                    activeRole === 'BUYER'
                      ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      : 'bg-yellow-50 text-yellow-600 border border-yellow-100 hover:bg-yellow-100 hover:border-yellow-200',
                  )}
                >
                  学员
                  {activeRole === 'BUYER' && (
                    <span className="absolute -top-1 -right-1 text-[10px] text-primary leading-none font-black">*</span>
                  )}
                </button>
                {user?.roles
                  ?.filter((r) => r.status === 1 && r.role !== 'BUYER' && r.role !== 'INDIVIDUAL_BUYER' && !PLATFORM_ROLES.has(r.role))
                  .map((r) => (
                    <button
                      type="button"
                      key={r.role}
                      onClick={() => activeRole !== r.role && setSwitchTarget(r.role)}
                      className={cn(
                        'relative px-2.5 py-0.5 rounded text-xs font-bold shadow-sm transition-all cursor-pointer',
                        activeRole === r.role
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'bg-primary/5 text-primary/70 border border-primary/10 hover:bg-primary/10 hover:border-primary/30 hover:text-primary',
                      )}
                    >
                      {ROLE_LABELS[r.role] || r.role}
                      {activeRole === r.role && (
                        <span className="absolute -top-1 -right-1 text-[10px] text-primary leading-none font-black">*</span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
            <div className="text-sm text-gray-500 flex flex-col gap-0.5">
              <span>学号：C{String(user?.id || 12).padStart(5, '0')}</span>
              {trainerCode && (
                <span>专家编号：{trainerCode}</span>
              )}
            </div>
          </div>
        </div>
        {/* 资产操作 */}
        <div className="lg:border-l border-slate-100 lg:pl-8 flex flex-col items-start lg:items-end w-full lg:w-auto">
          <div className="flex gap-12">
            <Link
              href={ROUTES.UC_MESSAGES}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div className="text-sm text-gray-500 mb-1 group-hover:text-primary transition-colors">消息</div>
              <div className="text-2xl font-bold text-primary font-mono group-hover:scale-110 transition-transform">{unreadMsgCount}</div>
            </Link>
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
          {/* 左半：继续学习 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
              <PlayCircle className="size-5" /> 继续学习
            </div>
            {continueLoading ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : continueLearning ? (
              <Link
                href={`${ROUTES.VIDEOS}/${continueLearning.videoId}`}
                className="border border-red-100 bg-red-50/30 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group block"
              >
                <h3 className="font-medium text-gray-800 mb-3 group-hover:text-primary transition-colors truncate">
                  《{continueLearning.title}》
                </h3>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                  <div
                    className="bg-primary h-1.5 rounded-full relative"
                    style={{ width: `${continueLearning.progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white border-2 border-primary rounded-full shadow" />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-gray-500">
                    已学习 {continueLearning.progress}%
                    {continueLearning.lastChapterTitle && ` (${continueLearning.lastChapterTitle})`}
                  </span>
                  <span className="text-xs text-primary border border-primary px-3 py-1.5 rounded group-hover:bg-primary group-hover:text-white transition-colors">
                    继续播放
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 border border-dashed border-slate-200 rounded-lg">
                <BookOpen className="size-8 mb-2 opacity-40" />
                <span className="text-sm">暂无学习中的课程</span>
                <Link href={ROUTES.VIDEOS} className="text-xs text-primary mt-2 hover:underline">
                  去发现课程 →
                </Link>
              </div>
            )}
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
                  onClick={(e) => {
                    e.preventDefault();
                    setChatOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 border border-slate-200 py-2.5 rounded hover:text-primary hover:border-red-200 hover:bg-red-50/30 transition-all"
                >
                  <Brain className="size-[18px]" /> AI智能选课
                </a>
                <Link
                  href={industryHotVideoHref}
                  onClick={handleIndustryHotVideoClick}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 border border-slate-200 py-2.5 rounded hover:text-primary hover:border-red-200 hover:bg-red-50/30 transition-all"
                >
                  <Flame className="size-[18px]" /> 行业热点课
                </Link>
              </div>
            </div>
            <div className="w-full h-[1px] bg-slate-100" />
            <div className="flex items-center gap-4">
              <div className="w-16 text-gray-500 font-medium text-sm text-right shrink-0">
                用好工具
              </div>
              <div className="flex-1 flex gap-3">
                <a
                  href="https://www.91pxb.com/?mod=marketing&do=intro"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-600 border border-slate-200 py-2.5 rounded hover:text-primary hover:border-red-200 hover:bg-red-50/30 transition-all"
                >
                  <Wrench className="size-[18px]" /> 培训宝
                </a>
                <a
                  href="https://www.91mbt.com/home/#/download"
                  target="_blank"
                  rel="noreferrer"
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

        <div className="p-6">
          {activeTab === 'recent' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentLoading ? (
                <div className="col-span-3 flex items-center justify-center h-48 text-gray-400">
                  <Loader2 className="size-5 animate-spin mr-2" />
                  <span className="text-sm">加载中...</span>
                </div>
              ) : recentVideos.length > 0 ? (
                <>
                  {recentVideos.map((video) => (
                    <Link
                      key={video.videoId}
                      href={`${ROUTES.VIDEOS}/${video.videoId}`}
                      className="group cursor-pointer border border-slate-100 rounded-lg overflow-hidden hover:shadow-lg transition-all block"
                    >
                      <div className="aspect-[16/10] bg-slate-800 relative overflow-hidden">
                        {video.coverUrl ? (
                          <Image
                            src={video.coverUrl}
                            alt={video.title}
                            width={400}
                            height={250}
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <PlayCircle className="size-12 opacity-30" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded">
                          录播课
                        </div>
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle className="size-10 text-white drop-shadow-md" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-primary transition-colors text-sm h-10">
                          {video.title}
                        </h3>
                        <div className="text-xs text-gray-500 mb-3">
                          讲师：{video.teacherName || '—'}
                        </div>
                        <div className="flex justify-between items-center mt-auto">
                          <span className="text-primary font-bold">
                            {video.pricePaid != null ? `¥ ${Number(video.pricePaid).toFixed(2)}` : '免费'}
                          </span>
                          <span className="text-xs text-gray-400">
                            已学 {video.progress}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {/* 发现更多 */}
                  <Link
                    href={ROUTES.UC_LEARNING}
                    className="group cursor-pointer border border-slate-100 rounded-lg overflow-hidden flex flex-col items-center justify-center bg-slate-50 border-dashed border-2 text-gray-400 hover:text-primary hover:border-primary/50 hover:bg-red-50/20 min-h-[200px]"
                  >
                    <Compass className="size-10 mb-2 opacity-50" />
                    <span className="text-sm font-medium">查看全部学习记录</span>
                  </Link>
                </>
              ) : (
                <>
                  <div className="col-span-2 flex flex-col items-center justify-center h-48 text-gray-400">
                    <BookOpen className="size-10 mb-3 opacity-30" />
                    <span className="text-sm">还没有学习记录</span>
                    <Link href={ROUTES.VIDEOS} className="text-xs text-primary mt-2 hover:underline">
                      去发现课程 →
                    </Link>
                  </div>
                  <Link
                    href={ROUTES.PUBLIC_COURSES}
                    className="group cursor-pointer border border-slate-100 rounded-lg overflow-hidden flex flex-col items-center justify-center bg-slate-50 border-dashed border-2 text-gray-400 hover:text-primary hover:border-primary/50 hover:bg-red-50/20 min-h-[200px]"
                  >
                    <Compass className="size-10 mb-2 opacity-50" />
                    <span className="text-sm font-medium">发现更多优质课程</span>
                  </Link>
                </>
              )}
            </div>
          )}

          {activeTab === 'recommend' && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Brain className="size-10 mb-3 opacity-30" />
              <span className="text-sm">智能推荐功能即将上线</span>
            </div>
          )}
        </div>
      </section>

      {/* 切换角色确认对话框 */}
      <CustomerServiceChatDialog open={chatOpen} onOpenChange={setChatOpen} />

      {switchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">切换当前身份</h3>
            <p className="text-sm text-gray-600 mb-5">
              确定要将当前身份切换为
              <span className="font-bold text-primary mx-1">
                {ROLE_LABELS[switchTarget] || switchTarget}
              </span>
              吗？
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSwitchTarget(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRole(switchTarget);
                  setSwitchTarget(null);
                }}
                className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
              >
                确认切换
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
