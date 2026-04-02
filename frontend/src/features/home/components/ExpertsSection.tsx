import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { SectionHeader } from './SectionHeader';
import type { Expert } from '../types';

interface ExpertsSectionProps {
  experts: Expert[];
}

/**
 * 推荐专家 — 6+3+3 混合布局
 * <p>
 * experts[0]: 左侧大卡（6列，图文并排）<br/>
 * experts[1]: 中间深色卡片（3列，圆形头像）<br/>
 * experts[2-3]: 右侧上下两张小卡（3列）
 * </p>
 */
export function ExpertsSection({ experts }: ExpertsSectionProps) {
  const t = useTranslations('home');

  const [main, middle, ...sideExperts] = experts;

  return (
    <section>
      <SectionHeader
        title={t('experts.sectionTitle')}
        viewMoreHref="/trainers"
        viewMoreText={t('experts.viewMore')}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[500px]">
        {/* 左：首席专家大卡（6 列） */}
        {main && <MainExpertCard expert={main} />}

        {/* 中：深色卡片（3 列） */}
        {middle && <MiddleExpertCard expert={middle} />}

        {/* 右：两张小卡（3 列） */}
        <div className="col-span-1 md:col-span-3 flex flex-col gap-6 h-full">
          {sideExperts.map((expert) => (
            <SideExpertCard key={expert.id} expert={expert} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** 左侧首席专家大卡 */
function MainExpertCard({ expert }: { expert: Expert }) {
  return (
    <Link
      href={`/trainers/${expert.id}`}
      className="col-span-1 md:col-span-6 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 flex flex-col md:flex-row h-full group"
    >
      <div className="md:w-[45%] h-64 md:h-full overflow-hidden relative shrink-0">
        <Image
          src={expert.coverImage || expert.avatar}
          alt={expert.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-white z-10 hidden md:block" />
        {expert.badge && (
          <span className="absolute top-4 left-4 bg-primary text-white px-3 py-1 rounded text-xs font-bold tracking-widest z-20 shadow-md">
            {expert.badge}
          </span>
        )}
      </div>
      <div className="md:w-[55%] p-6 lg:p-8 flex flex-col flex-1 relative z-20">
        <h3 className="text-3xl font-black mb-2 text-slate-800">
          {expert.name}
          {expert.title && (
            <span className="text-lg font-normal text-slate-500 ml-2">
              {expert.title}
            </span>
          )}
        </h3>
        {expert.subtitle && (
          <p className="text-primary text-sm font-bold mb-6">
            {expert.subtitle}
          </p>
        )}
        <p className="text-slate-500 text-sm mb-8 leading-relaxed line-clamp-4">
          {expert.bio}
        </p>
        <div className="mt-auto flex flex-col gap-4">
          <div className="flex gap-2">
            {expert.tags.map((tag) => (
              <span
                key={tag}
                className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-xs font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full mt-2 shadow-sm">
            查看专家详情
          </span>
        </div>
      </div>
    </Link>
  );
}

/** 中间深色卡片 */
function MiddleExpertCard({ expert }: { expert: Expert }) {
  return (
    <Link
      href={`/trainers/${expert.id}`}
      className="col-span-1 md:col-span-3 bg-gradient-to-b from-slate-900 to-[#3b0a0a] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all relative flex flex-col items-center pt-10 pb-8 px-6 group text-white h-full"
    >
      <div className="w-32 h-32 rounded-full overflow-hidden mb-5 border-4 border-primary/30 shadow-inner">
        <Image
          src={expert.avatar}
          alt={expert.name}
          width={128}
          height={128}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="text-2xl font-bold mb-3 tracking-wide">{expert.name}</h3>
      <p className="text-white/80 text-sm text-center mb-6 leading-relaxed line-clamp-3">
        {expert.bio}
      </p>
      <div className="flex gap-2 mb-8">
        {expert.tags.map((tag) => (
          <span
            key={tag}
            className="px-4 py-1.5 rounded-full border border-white/20 text-xs bg-white/5"
          >
            {tag}
          </span>
        ))}
      </div>
      <span className="w-full py-3 rounded-lg border border-primary/50 hover:bg-primary hover:border-primary transition-colors font-medium text-sm z-10 mt-auto shadow-sm text-center">
        查看专家详情
      </span>
    </Link>
  );
}

/** 右侧小卡片 */
function SideExpertCard({ expert }: { expert: Expert }) {
  return (
    <Link
      href={`/trainers/${expert.id}`}
      className="bg-white rounded-xl p-6 flex flex-col border border-slate-100 shadow-sm hover:shadow-md transition-all flex-1 group relative overflow-hidden"
    >
      <div className="flex items-start gap-4 mb-3">
        <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-slate-100">
          <Image
            src={expert.avatar}
            alt={expert.name}
            width={56}
            height={56}
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">
            {expert.name}
          </h3>
          <p className="text-slate-500 text-xs mt-1">{expert.title}</p>
        </div>
      </div>
      <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-2">
        {expert.bio}
      </p>
      <div className="flex gap-2 mt-auto">
        {expert.tags.map((tag) => (
          <span
            key={tag}
            className="bg-slate-50 text-slate-500 px-2 py-1 rounded text-[10px]"
          >
            {tag}
          </span>
        ))}
      </div>
      <span className="absolute bottom-6 right-6 text-primary hover:text-primary/80 transition-colors">
        <ArrowRight className="size-5" />
      </span>
    </Link>
  );
}
