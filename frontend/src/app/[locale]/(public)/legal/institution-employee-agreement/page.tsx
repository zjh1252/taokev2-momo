import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '淘课网注册培训机构员工合作协议',
  description:
    '淘课网注册培训机构员工合作协议（v1）：明确机构员工与平台之间的角色定位、授权范围、保密义务与协议变更与终止条款。',
};

/**
 * 静态法务页面：淘课网注册培训机构员工合作协议
 *
 * <p>该页面为「机构员工申请表单」中协议勾选项的跳转目标，文案版本号需与
 * {@code InstitutionEmployeeFormData.agreementVersion} 默认值（v1）保持一致；
 * 后续如需更新条款，应同步增加新版本号并完成存量员工的二次签署引导。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 18:00
 */
export default function InstitutionEmployeeAgreementPage() {
  const sections: Array<{ title: string; paragraphs: string[] }> = [
    {
      title: '一、协议主体与适用范围',
      paragraphs: [
        '本协议由您（以下简称"机构员工"或"乙方"）与淘课网（以下简称"平台"或"甲方"）签署，自您勾选并提交注册培训机构员工申请之时起对双方生效。',
        '本协议适用于乙方在平台上以"机构员工"身份开展的全部活动，包括但不限于代表所属机构维护机构资料、上传/管理课程与案例、维护师资团队、对外接收订单等。',
      ],
    },
    {
      title: '二、与所属机构的关系',
      paragraphs: [
        '乙方需经所属机构在用户中心审核确认，方可正式生效"机构员工"角色。一旦解除与机构的绑定，乙方对应的代发布等权限同步取消。',
        '乙方在平台代表所属机构开展业务时，应严格遵守所属机构对外承诺的服务规范与品牌形象。',
      ],
    },
    {
      title: '三、服务内容',
      paragraphs: [
        '甲方为乙方提供机构内运营所需的发布、管理、消息通知与基础数据看板等平台能力。',
        '具体的授权范围（如可代发布的资源类型、可处理的订单范围）由所属机构在用户中心配置或通过日常运营约定。',
      ],
    },
    {
      title: '四、信息真实与合规',
      paragraphs: [
        '乙方承诺其在平台提交的真实姓名、联系方式、邮箱、服务城市等信息真实有效。',
        '乙方应根据国家及行业相关法律法规依法开展业务，对其在平台代表所属机构发布的全部内容的合规性独立承担相应责任。',
      ],
    },
    {
      title: '五、知识产权与保密义务',
      paragraphs: [
        '乙方在平台代表所属机构发布的全部资料，对应的权属与授权关系按所属机构与平台间的合作协议执行。',
        '乙方就在平台合作过程中知悉的对方商业秘密、客户信息、合作报价等承担保密义务，未经书面同意不得向第三方披露。本条款在协议终止后仍持续有效。',
      ],
    },
    {
      title: '六、行为规范与违约责任',
      paragraphs: [
        '乙方应诚信履约，不得利用平台账号从事与所属机构业务无关的私人交易（即"飞单"），不得侵害所属机构与平台合法权益。',
        '甲方有权依据本协议、平台规则及相关投诉处理流程对违规行为采取警示、暂停服务、终止合作等措施，并可通知所属机构。',
      ],
    },
    {
      title: '七、协议变更与终止',
      paragraphs: [
        '甲方有权根据法律法规更新或业务发展需要，对本协议进行修订并在平台公示；如乙方在公示后继续在平台上提供服务，视为同意修订后的版本。',
        '乙方可随时通过平台申请终止本协议；终止前已生成的订单仍按原约定履行至完成。',
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
        <h1 className="text-3xl font-bold text-gray-900">淘课网注册培训机构员工合作协议</h1>
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
