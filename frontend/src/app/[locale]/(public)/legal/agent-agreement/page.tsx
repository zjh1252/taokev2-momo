import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '淘课网注册专家经纪人合作协议',
  description:
    '淘课网注册专家经纪人合作协议（v1）：明确经纪人与平台、经纪公司之间的服务范围、佣金结算、信息保密与终止条款。',
};

/**
 * 静态法务页面：淘课网注册专家经纪人合作协议
 *
 * <p>该页面为「专家经纪人申请表单」中协议勾选项的跳转目标，文案版本号需与
 * {@code AgentFormData.agreementVersion} 默认值（v1）保持一致。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 15:30
 */
export default function AgentAgreementPage() {
  const sections: Array<{ title: string; paragraphs: string[] }> = [
    {
      title: '一、协议主体与适用范围',
      paragraphs: [
        '本协议由您（以下简称"经纪人"或"乙方"）与淘课网（以下简称"平台"或"甲方"）签署，自您勾选并提交注册经纪人申请之时起对双方生效。',
        '本协议适用于乙方在平台上以"经纪人"身份开展的全部活动，包括但不限于代专家发布信息、对接客户需求、协助合同履约与款项结算等。',
      ],
    },
    {
      title: '二、服务内容',
      paragraphs: [
        '乙方应隶属于平台已认证的某一经纪公司，受经纪公司管理与考核。',
        '乙方代理专家在平台进行个人主页维护、课程发布、报价管理、订单跟进、客户回访等日常运营工作。',
        '甲方负责提供需求撮合、订单管理、合同签署辅助、款项结算等基础平台服务。',
      ],
    },
    {
      title: '三、佣金与结算',
      paragraphs: [
        '乙方与所属经纪公司之间的佣金分配比例，由经纪公司与乙方另行约定，平台不直接介入。',
        '甲方在客户付款且课程交付完成后，按合作约定向所属经纪公司结算款项；经纪公司再按内部约定结算给乙方。',
      ],
    },
    {
      title: '四、行为规范与违约责任',
      paragraphs: [
        '乙方应诚信履约，不得在平台外私自承揽通过本平台获得的客户订单。',
        '乙方应妥善保管平台账号与客户资料，因泄露造成损失的，需承担相应赔偿责任。',
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
        <h1 className="text-3xl font-bold text-gray-900">淘课网注册专家经纪人合作协议</h1>
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
