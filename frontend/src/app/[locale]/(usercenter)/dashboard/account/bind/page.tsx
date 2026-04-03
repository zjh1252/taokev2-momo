'use client';

const BINDINGS = [
  { name: '微信', bound: false },
  { name: '支付宝', bound: false },
  { name: '企业微信', bound: false },
];

/**
 * 账号绑定页 — 第三方账号绑定（无后端 API，全部写死）
 *
 * @author Fangxinxin
 * @date 2026-04-03 11:30
 */
export default function AccountBindPage() {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
      <div className="text-xl font-bold text-gray-900">账号绑定</div>
      <div className="mt-4 space-y-3">
        {BINDINGS.map((item) => (
          <div
            key={item.name}
            className="border border-slate-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="text-sm">{item.name}</div>
            {/* TODO: 接入第三方绑定 API */}
            <button
              type="button"
              className="text-xs border border-slate-300 rounded px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
            >
              {item.bound ? '解绑' : '去绑定'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
