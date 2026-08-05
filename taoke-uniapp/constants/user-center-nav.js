import { isContentRole } from '@/utils/delegating-role';

/**
 * 按 activeRole 生成「我的」页动态菜单（对齐 PC user-center-sidebar）
 */
export function getUserCenterMenus(activeRole) {
  const supply = [];
  const account = [];

  if (['AGENT', 'ASSISTANT', 'INSTITUTION', 'ENTERPRISE_AGENT', 'INSTITUTION_EMPLOYEE'].includes(activeRole)) {
    supply.push({
      label: '我的专家',
      icon: 'expert',
      color: 'red',
      url: '/pages/binding/my-experts',
    });
  }

  if (activeRole === 'TRAINER') {
    supply.push({
      label: '我的代理',
      icon: 'person',
      color: 'gray',
      url: '/pages/binding/my-agents',
    });
  }

  if (activeRole === 'AGENT') {
    supply.push({
      label: '我的经纪公司',
      icon: 'vip',
      color: 'gray',
      url: '/pages/binding/my-enterprise-agent',
    });
  }

  if (activeRole === 'ENTERPRISE_AGENT') {
    supply.push({
      label: '我的经纪人',
      icon: 'person',
      color: 'gray',
      url: '/pages/binding/my-agents-team',
    });
  }

  if (activeRole === 'INSTITUTION') {
    supply.push({
      label: '我的员工',
      icon: 'person',
      color: 'gray',
      url: '/pages/binding/my-employees',
    });
  }

  if (activeRole === 'INSTITUTION_EMPLOYEE') {
    supply.push({
      label: '我的机构',
      icon: 'course',
      color: 'gray',
      url: '/pages/binding/my-institution',
    });
  }

  if (isContentRole(activeRole)) {
    supply.push(
      {
        label: '我的课程',
        icon: 'course',
        color: 'orange',
        url: '/pages/publish/course-list',
      },
      {
        label: '我的案例',
        icon: 'list',
        color: 'blue',
        url: '/pages/publish/case-list',
      },
      {
        label: '精彩瞬间',
        icon: 'camera',
        color: 'green',
        url: '/pages/publish/highlight-list',
      },
    );
  }

  if (activeRole === 'TRAINER') {
    account.push(
      { label: '实名认证', icon: 'person', color: 'red', url: '/pages/user/cert/real-name' },
      { label: '专业认证', icon: 'vip', color: 'red', url: '/pages/user/cert/professional' },
      { label: '学历认证', icon: 'course', color: 'red', url: '/pages/user/cert/education' },
      { label: '工作认证', icon: 'list', color: 'red', url: '/pages/user/cert/work' },
    );
  }

  if (activeRole === 'ENTERPRISE_AGENT') {
    account.push({
      label: '资质认证',
      icon: 'vip',
      color: 'red',
      url: '/pages/user/cert/agency-qualification',
    });
  }

  if (activeRole === 'INSTITUTION') {
    account.push({
      label: '公司资料',
      icon: 'course',
      color: 'red',
      url: '/pages/user/cert/institution-company',
    });
  }

  return { supply, account };
}
