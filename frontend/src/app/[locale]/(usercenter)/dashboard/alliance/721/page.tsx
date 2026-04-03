'use client';

/**
 * 721讲师合作 — 协议文本 + 表单（全部写死）
 *
 * @author Fangxinxin
 * @date 2026-04-03 13:00
 */
export default function Alliance721Page() {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center">
        <h2 className="font-bold text-gray-800">721讲师合作</h2>
      </div>

      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          淘课721讲师合作协议
        </h1>

        <div className="w-full flex justify-between text-sm font-bold text-gray-800 mb-4 px-4">
          <span>甲方：</span>
          <span>乙方：上海淘课企业管理咨询有限公司</span>
        </div>

        {/* 协议滚动区 */}
        <div className="w-full border border-gray-300 p-6 text-[13px] text-gray-700 leading-loose h-[320px] overflow-y-auto mb-8 bg-white">
          <p className="mb-4">
            根据相关法律法规，甲乙双方就甲方成为淘课合作讲师事宜，在平等、互信的基础上，达成如下合作协议：
          </p>
          <p className="font-bold mb-2 mt-4">一、要点</p>
          <p>1. 乙方为甲方拓展各种形式的推广渠道（统称乙方渠道）。</p>
          <p>
            2.
            甲方到乙方网站注册，发布讲师介绍、课程介绍（含课程知识考题），完善学历、工作经历、授课案例等信息，承诺"质量五包"，提升真实、靠谱的专家形象。
          </p>
          <p>
            3.
            乙方与甲方沟通，核实甲方所发布的履历、案例等信息。若审核通过，乙方给甲方打上"五包"标签。
          </p>
          <p>
            4.
            对需要培训721齐全的客户，甲乙双方协力满足客户需求，让客户学员训后切实执行课堂知识。
          </p>
          <p className="font-bold mb-2 mt-4">二、期限</p>
          <p>服务期限3年。</p>
          <p className="font-bold mb-2 mt-4">三、结算</p>
          <p>1. 甲方出场授课课酬由双方友好协商确定。</p>
          <p>2. 对给客户实施721齐全的项目，甲方课酬在原课酬基础增加10%。</p>
          <p>
            3.
            乙方在收到客户全款后10个工作日内与甲方结算课酬。
          </p>
          <p className="text-gray-400 mt-4">
            ... 更多条款请查看完整协议 ...
          </p>
        </div>

        {/* 表单 */}
        <div className="w-full max-w-xl">
          <div className="space-y-4">
            {[
              { label: '讲师姓名', required: true },
              { label: '身份证号', required: true },
            ].map(({ label, required }) => (
              <div key={label} className="flex items-center">
                <span className="w-24 text-right pr-4 text-sm text-gray-700">
                  {required && (
                    <span className="text-red-500 mr-1">*</span>
                  )}
                  {label}
                </span>
                <input
                  type="text"
                  placeholder="请输入"
                  className="flex-1 border border-gray-300 px-3 py-1.5 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] text-sm"
                />
              </div>
            ))}
            <div className="flex items-center">
              <span className="w-24 text-right pr-4 text-sm text-gray-700">
                <span className="text-red-500 mr-1">*</span>合作年限
              </span>
              <select className="flex-1 border border-gray-300 px-3 py-1.5 text-sm text-gray-800 bg-white">
                <option>3年</option>
                <option>2年</option>
                <option>1年</option>
              </select>
            </div>
            {[
              '课酬(元/天)',
              '地址',
              '手机号',
              '微信',
              'Email',
              '开户银行',
              '账号',
            ].map((label) => (
              <div key={label} className="flex items-center">
                <span className="w-24 text-right pr-4 text-sm text-gray-700">
                  <span className="text-red-500 mr-1">*</span>
                  {label}
                </span>
                <input
                  type="text"
                  placeholder="请输入"
                  className="flex-1 border border-gray-300 px-3 py-1.5 focus:outline-none focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] text-sm"
                />
              </div>
            ))}
            <div className="flex items-start mt-4">
              <span className="w-24 text-right pr-4 text-sm text-gray-700 pt-2">
                <span className="text-red-500 mr-1">*</span>签字
              </span>
              <div className="flex-1 border border-gray-300 h-32 bg-white" />
            </div>
          </div>

          {/* TODO: 接入721讲师合作申请 API */}
          <div className="mt-8 text-center w-full flex justify-end pl-24">
            <button
              type="button"
              className="w-full bg-[#f44336] hover:bg-[#d32f2f] text-white font-bold text-[15px] py-3 shadow-sm transition-colors"
            >
              保存并预览
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
