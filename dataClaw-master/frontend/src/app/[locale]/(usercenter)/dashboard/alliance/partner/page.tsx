'use client';

/**
 * 培训合伙人 — 协议文本 + 申请表单（全部写死）
 *
 * @author Fangxinxin
 * @date 2026-04-03 13:00
 */
export default function PartnerPage() {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center">
        <h2 className="font-bold text-gray-800">培训合伙人</h2>
      </div>

      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          淘课联盟培训合伙人合作协议
        </h1>

        <div className="w-full flex justify-between text-sm font-bold text-gray-800 mb-4 px-4">
          <span>甲方：TPC_WXQDSE20260330</span>
          <span>乙方：上海淘课企业管理咨询有限公司</span>
        </div>

        {/* 协议滚动区 */}
        <div className="w-full border border-gray-300 p-6 text-[13px] text-gray-700 leading-loose h-[320px] overflow-y-auto mb-8 bg-white">
          <p className="mb-4">
            甲乙双方本着自愿、平等、互利的原则，经充分协商，就协力服务企业客户订立本合同。
          </p>
          <p className="font-bold mb-2 mt-4">一、合作要点</p>
          <p>
            1.1
            甲方参与乙方发起的培训机构联盟，乙方向甲方开放产品等资源，支持甲方服务好客户，赢得更多合同收入；
          </p>
          <p className="pl-4">
            （1）开放培训宝产品：用好培训宝，甲方可增进客情，更可持久留住客户；
          </p>
          <p className="pl-4">
            （2）开放师资类产品：含乙方研发的和乙方整合的产品，甲方多一个产品多一份收入；
          </p>
          <p className="pl-4">
            （3）开放录播课平台：客户直接采购乙方平台上的录播课，甲方也可分成；
          </p>
          <p className="pl-4">
            （4）开放公开课平台：客户直接采购乙方平台上的公开课，甲方也可分成；
          </p>
          <p className="pl-4">
            （5）开放客户资源：在征得客户同意的情况下，乙方介绍甲方跟进服务乙方网站的无主客户。
          </p>
          <p>
            1.2
            对同一客户，乙方只与一位联盟成员合作跟进服务；
          </p>
          <p>
            1.3
            甲方缴纳一次性加盟费用980元，获赠980元/年的培训宝高级会员套餐。
          </p>
          <p className="font-bold mb-2 mt-4">二、乙方产品</p>
          <p>2.1 非课酬产品：培训宝、公开课、录播课。</p>
          <p>2.2 课酬类产品：TTM内训课、EES、BEC、EGS、淘课网师资课程。</p>
          <p className="font-bold mb-2 mt-4">三、利益分配</p>
          <p>3.1 原则：甲方预付产品成本，享有100%的项目利润。</p>
          <p className="text-gray-400 mt-4">
            ... 更多条款请查看完整协议 ...
          </p>
        </div>

        {/* 表单 */}
        <div className="w-full max-w-xl">
          <div className="flex items-center mb-6">
            <span className="w-24 text-right pr-6 text-sm text-gray-700">
              你的身份
            </span>
            <label className="flex items-center gap-1.5 text-sm text-[#0066cc] cursor-pointer">
              <input
                type="radio"
                name="identity"
                defaultChecked
                className="w-3.5 h-3.5"
              />
              公司
            </label>
          </div>

          <div className="space-y-4">
            {[
              '联系人名字',
              '公司名称',
              '公司电话',
              '公司邮箱',
            ].map((label) => (
              <div key={label} className="flex items-center">
                <span className="w-24 text-right pr-6 text-sm text-gray-700">
                  {label}
                </span>
                <input
                  type="text"
                  className="flex-1 border border-gray-300 px-3 py-1.5 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]"
                />
              </div>
            ))}
            <div className="flex items-center">
              <span className="w-24 text-right pr-6 text-sm text-gray-700">
                公司所在地
              </span>
              <div className="flex gap-2 flex-1">
                <select className="flex-1 border border-gray-300 px-3 py-1.5 text-sm text-gray-800 bg-white">
                  <option>请选择省份</option>
                </select>
                <select className="flex-1 border border-gray-300 px-3 py-1.5 text-sm text-gray-800 bg-white">
                  <option>请选择城市</option>
                </select>
              </div>
            </div>
            {['公司法人', '法人身份证', '联系人QQ'].map((label) => (
              <div key={label} className="flex items-center">
                <span className="w-24 text-right pr-6 text-sm text-gray-700">
                  {label}
                </span>
                <input
                  type="text"
                  className="flex-1 border border-gray-300 px-3 py-1.5 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc]"
                />
              </div>
            ))}
          </div>

          {/* TODO: 接入合伙人申请 API */}
          <div className="mt-10 text-center">
            <button
              type="button"
              className="bg-[#cc0000] hover:bg-[#b30000] text-white font-bold text-[15px] px-8 py-3 rounded shadow-sm transition-colors"
            >
              本人同意上述协议并申请成为淘课培训合伙人
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
