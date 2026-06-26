import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '淘课网注册专家助理合作协议',
  description:
    '淘课网注册专家助理合作协议（v1）：明确助理在为专家代发布、跟进订单等场景下的服务范围、保密义务与终止条款。',
};

/**
 * 静态法务页面：淘课网注册专家助理合作协议
 *
 * <p>该页面为「专家助理申请表单」中协议勾选项的跳转目标，文案版本号需与
 * {@code AssistantFormData.agreementVersion} 默认值（v1）保持一致。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 15:30
 */
export default function AssistantAgreementPage() {
  const sections: Array<{ title: string; paragraphs: string[] }> = [
    {
      title: '一、协议主体与适用范围',
      paragraphs: [
        '本协议由您（以下简称"助理"或"乙方"）与淘课网（以下简称"平台"或"甲方"）签署，自您勾选并提交注册助理申请之时起对双方生效。',
        '本协议适用于乙方在平台上以"专家助理"身份开展的全部活动，包括但不限于代专家维护主页、代发布课程与案例、跟进订单交付等。',
      ],
    },
    {
      title: '二、服务内容',
      paragraphs: [
        '乙方需绑定一位平台已认证的专家后，方可代该专家发布课程、案例、视频、著作等资源。',
        '乙方应严格按照专家本人授权范围执行操作，不得越权处理涉及报价、合同、收款等核心事项。',
      ],
    },
    {
      title: '三、佣金与结算',
      paragraphs: [
        '乙方与所属专家之间的服务费用由双方自行约定，平台不直接介入。',
        '甲方与专家之间的款项结算流程不因助理参与而变更。',
      ],
    },
    {
      title: '四、行为规范与违约责任',
      paragraphs: [
        '乙方应诚信履约，不得擅自变更专家的报价、合作条款及发布内容。',
        '乙方应妥善保管平台账号与专家资料，因泄露造成损失的，需承担相应赔偿责任。',
      ],
    },
    {
      title: '五、保密条款',
      paragraphs: [
        '双方就合作过程中知悉的对方商业秘密、客户信息、未公开的课程内容、授课报价等承担保密义务，未经对方书面同意不得向任何第三方披露。',
        '本条款在协议终止后仍持续有效。',
      ],
    },
    {
      title: '六、协议变更与终止',
      paragraphs: [
        '甲方有权根据法律法规更新或业务发展需要，对本协议进行修订并在平台公示；如乙方在公示后继续在平台上提供服务，视为同意修订后的版本。',
        '乙方可随时通过平台申请终止本协议；终止前已生成的订单仍按原约定履行至完成。',
      ],
    },
    {
      title: '七、知识产权',
      paragraphs: [
        '乙方在平台上代为发布的内容应取得专家本人授权，不得侵犯第三方权利。',
        '甲方对平台界面、品牌标识、运营数据等享有合法权利，乙方不得擅自使用。',
      ],
    },
    {
      title: '八、争议解决',
      paragraphs: [
        '本协议的订立、效力、解释、履行及争议解决均适用中华人民共和国法律。',
        '如双方就协议项下事项发生争议，应首先友好协商；协商不成的，任何一方均有权向甲方所在地有管辖权的人民法院提起诉讼。',
      ],
    },
  ];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16">
      <header className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900">淘课网注册专家助理合作协议</h1>
        <p className="mt-2 text-sm text-gray-500">版本号：v1</p>
        <p className="mt-1 text-sm text-gray-500">
          请您在勾选同意前仔细阅读以下全部条款，特别是与您权利义务有关的加重、限制条款。
        </p>
      </header>

      <article className="space-y-8 text-[15px] leading-7 text-gray-800">
        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-3 text-lg font-bold text-gray-900">{section.title}</h2>
            <div className="space-y-2">
              {section.paragraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}

        <section className="border-t border-slate-200 pt-6 text-sm text-gray-500">
          <p>
            如对本协议存在任何疑问，可在工作时间通过站内消息或客服电话与平台运营团队联系。
          </p>
        </section>
      </article>
    </div>
  );
}
