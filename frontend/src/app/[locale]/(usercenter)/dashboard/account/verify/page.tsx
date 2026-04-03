'use client';

/**
 * 账号认证页 — 身份证上传（无后端 API，全部写死）
 *
 * @author Fangxinxin
 * @date 2026-04-03 11:30
 */
export default function AccountVerifyPage() {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      <div className="text-xl font-bold text-gray-900">账号认证</div>
      <div className="text-sm text-gray-500 mt-2">当前状态：未认证</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center text-sm text-gray-500 cursor-pointer hover:border-primary hover:text-primary transition-colors">
          上传身份证人像面
        </div>
        <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center text-sm text-gray-500 cursor-pointer hover:border-primary hover:text-primary transition-colors">
          上传身份证国徽面
        </div>
      </div>
      {/* TODO: 接入后端实名认证 API */}
      <button
        type="button"
        className="mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors"
      >
        提交认证
      </button>
    </section>
  );
}
