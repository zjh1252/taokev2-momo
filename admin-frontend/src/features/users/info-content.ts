import type { InfobarContent } from '@/components/ui/infobar';

export const usersInfoContent: InfobarContent = {
  title: '用户管理',
  sections: [
    {
      title: '功能说明',
      description:
        '支持按手机号、昵称、真实姓名搜索用户，按状态（正常/冻结）筛选，以及对用户进行冻结或解冻操作。',
      links: []
    }
  ]
};
