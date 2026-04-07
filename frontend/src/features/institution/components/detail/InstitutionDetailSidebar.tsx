import type { InstitutionDetail } from '../../types';

interface InstitutionDetailSidebarProps {
  institution: InstitutionDetail;
}

export function InstitutionDetailSidebar({ institution }: InstitutionDetailSidebarProps) {
  return (
    <aside className="w-full lg:w-[300px] shrink-0 flex flex-col gap-6">
      {/* 机构信息摘要 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center">
          <h3 className="font-bold text-primary text-[15px] border-l-2 border-primary pl-2 leading-none">
            机构信息
          </h3>
        </div>
        <div className="p-4 flex flex-col gap-3 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <span className="text-slate-400 shrink-0 w-16">擅长领域</span>
            <span className="text-slate-700">{institution.specialties || '暂无'}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-slate-400 shrink-0 w-16">擅长行业</span>
            <span className="text-slate-700">{institution.industries || '暂无'}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-slate-400 shrink-0 w-16">公开课数</span>
            <span className="text-slate-700">{institution.openCourseCount}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-slate-400 shrink-0 w-16">内训课数</span>
            <span className="text-slate-700">{institution.innerCourseCount}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-slate-400 shrink-0 w-16">机构人气</span>
            <span className="text-primary font-bold">{institution.viewCount}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-slate-400 shrink-0 w-16">机构评价</span>
            <span className="text-primary font-bold">{institution.commentCount}条</span>
          </div>
        </div>
      </div>

      {/* AI 助手推荐区 */}
      <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl shadow-sm border border-red-100 overflow-hidden p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-red-400 flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
            <span className="text-white text-lg">🤖</span>
          </div>
          <div>
            <h3 className="text-slate-900 font-bold text-sm">AI 智能客服</h3>
            <p className="text-slate-500 text-xs">为您推荐合适的培训方案</p>
          </div>
        </div>
        <button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 rounded-lg shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 text-sm">
          💬 立即对话 AI
        </button>
      </div>
    </aside>
  );
}
