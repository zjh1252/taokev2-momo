'use client';

/**
 * 推广大使 — 培训宝推广大使协议 + 同意按钮（全部写死）
 *
 * @author Fangxinxin
 * @date 2026-04-03 13:00
 */
export default function AmbassadorPage() {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
        <h2 className="font-bold text-gray-800">培训宝推广大使</h2>
        <a href="#" className="text-[#0066cc] text-sm hover:underline">
          (查看协议)
        </a>
      </div>
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          培训宝大使协议
        </h1>

        <div className="w-full flex justify-between text-sm font-bold text-gray-800 mb-6 px-4">
          <span>甲方：TPC_WXQDSE20260330</span>
          <span>乙方：上海淘课企业管理咨询有限公司</span>
        </div>

        <div className="space-y-4 text-sm text-gray-700 leading-loose text-justify px-4 w-full">
          <p>
            1.
            甲方自愿申请成为乙方的培训宝大使，兼职向企业培训经理等推广介绍培训宝，引导他们也注册成为培训宝会员（这些会员后称甲方所介绍会员），让他们也使用培训宝提升工作效率、累积培训经验档案、赢得领导绩效认同等。
          </p>
          <p>
            2.
            甲方所介绍会员自注册之日始1年内若有采购培训宝各收费功能，甲方可获得培训宝采购全额*10%的奖金。多邀多买多得，上不封顶。
          </p>
          <p>
            3.
            对所获奖金，甲方每月可申请提现一次，乙方按甲方要求转账到甲方指定银行账户。
          </p>
          <p>
            4.
            甲方清楚并接受：在网站所显示的奖金全额为税前收益，甲方提现需要缴纳劳务个税，个税在甲方提现时由乙方公司代为扣缴。
          </p>
          <p>
            5.
            甲方承诺以合法方式推广乙方的服务，不损害乙方声誉，不以权谋私。以权谋私的采购，乙方不给甲方奖金。
          </p>
          <p>
            6.
            本大使活动与淘课（含培训宝、培训人社区和淘课网）其它活动奖励若有重合，甲方只享有本活动的奖励。
          </p>
          <p>
            7.
            甲方在签约成为大使之前可能也介绍了一些会员：若这些会员在双方签约之时还没有采购培训宝，签约之后发生的采购也适用本协议奖金机制；若这些会员在双方签约之时已有采购培训宝，这些会员的采购与甲方无关。
          </p>
          <p>
            8.
            双方是否合作、甲方获得奖金等合作信息，双方均有保密责任，不得泄露。
          </p>
          <p>
            9.
            本协议自甲方提出申请并通过乙方审核之刻生效。生效之日起1年内，甲方可按协议推广培训宝获得奖金。协议生效满1年后，甲方再新增所介绍会员无奖金，但继续享受协议有效期内所介绍会员的奖金回报，直至甲方所介绍会员全部注册满了1年为止。
          </p>
        </div>

        {/* TODO: 接入推广大使申请 API */}
        <button
          type="button"
          className="mt-10 bg-[#cc0000] hover:bg-[#b30000] text-white font-bold text-[15px] px-8 py-3 rounded shadow-sm transition-colors"
        >
          本人同意上述协议并自愿申请成为推广大使
        </button>
      </div>
    </section>
  );
}
