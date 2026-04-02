import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { Bot } from 'lucide-react';
import type { TrainerDetail, MockRelatedTrainer } from '../../types';

interface TrainerSidebarProps {
  trainer: TrainerDetail;
  relatedTrainers: MockRelatedTrainer[];
}

export function TrainerSidebar({ trainer, relatedTrainers }: TrainerSidebarProps) {
  const topics = trainer.goodAt?.split(/[,，、]/).filter(Boolean) ?? [];

  return (
    <aside className="space-y-3 lg:sticky lg:top-[96px] max-h-[calc(100vh-120px)] overflow-y-auto overflow-x-hidden h-fit scrollbar-hide">
      {/* 讲师基础信息 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="font-bold text-lg mb-2">讲师基础信息</h3>
        <div className="space-y-1.5 text-[13px] text-slate-500">
          {trainer.experienceYears != null && trainer.experienceYears > 0 && (
            <div className="flex justify-between">
              <span>从业年限</span>
              <span className="text-slate-900">{trainer.experienceYears} 年</span>
            </div>
          )}
          {trainer.teachingYears != null && trainer.teachingYears > 0 && (
            <div className="flex justify-between">
              <span>培训年限</span>
              <span className="text-slate-900">{trainer.teachingYears} 年</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>累计咨询</span>
            <span className="text-slate-900">{trainer.consultationCount || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>综合评分</span>
            <span className="text-slate-900">{trainer.score?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
      </div>

      {/* 擅长专题 */}
      {topics.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-slate-500 rounded-full" />
            <h3 className="font-bold text-lg">擅长专题</h3>
          </div>
          <ul className="space-y-2 text-[13px] text-slate-900 list-disc pl-5 marker:text-slate-400">
            {topics.map((topic) => (
              <li
                key={topic}
                className="pl-1 hover:text-primary cursor-pointer transition-colors"
              >
                {topic.trim()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 推荐相关专家 */}
      {relatedTrainers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-slate-500 rounded-full" />
            <h3 className="font-bold text-lg">推荐相关专家</h3>
          </div>
          <div className="space-y-3">
            {relatedTrainers.map((t) => (
              <Link
                key={t.id}
                href={`/experts/${t.id}`}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-medium text-slate-900 group-hover:text-primary transition-colors text-[13px]">
                    {t.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{t.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* AI 智能匹配 */}
      <div className="bg-primary rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="size-5" />
          <h3 className="font-bold text-lg">AI 智能匹配</h3>
        </div>
        <p className="text-[13px] text-white/85 mt-1 leading-relaxed">
          输入您的培训需求，AI 助手将为您精准匹配最适合的讲师和课程方案。
        </p>
        <button className="w-full mt-3 py-2 rounded-lg bg-white text-primary text-[14px] font-semibold hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5">
          立即体验
        </button>
      </div>
    </aside>
  );
}
