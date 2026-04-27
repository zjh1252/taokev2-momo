'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  overview: '总览',
  users: '用户管理',
  product: '课程管理',
  courses: '课程管理',
  plans: '排课管理',
  'training-reviews': '培训评价管理',
  videos: '录播课管理',
  trainers: '专家管理',
  institutions: '机构管理',
  employees: '机构员工',
  agents: '专家经纪人管理',
  'enterprise-agents': '专家经纪公司管理',
  assistants: '专家助理管理',
  'enterprise-buyers': '企业采购方管理',
  applications: '申请管理',
  categories: '分类管理',
  'course-category': '课程分类',
  'trainer-expertise': '专家擅长领域',
  'trainer-industry': '专家擅长行业',
  notifications: '通知管理',
  'notification-templates': '通知模板管理',
  send: '发送通知',
  roles: '角色管理',
  permissions: '权限管理',
  settings: '系统设置',
  cases: '案例管理',
  highlights: '精彩瞬间管理',
  'sensitive-words': '敏感词管理'
};

const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/overview': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '总览', link: '/dashboard/overview' }
  ],
  '/dashboard/users': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '/dashboard/users' }
  ],
  '/dashboard/courses': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '课程管理', link: '/dashboard/courses' }
  ],
  '/dashboard/courses/plans': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '课程管理', link: '/dashboard/courses' },
    { title: '排课管理', link: '/dashboard/courses/plans' }
  ],
  '/dashboard/training-reviews': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '培训评价管理', link: '/dashboard/training-reviews' }
  ],
  '/dashboard/videos': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '录播课管理', link: '/dashboard/videos' }
  ],
  '/dashboard/trainers': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '专家管理', link: '/dashboard/trainers' }
  ],
  '/dashboard/trainers/applications': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '专家管理', link: '/dashboard/trainers' },
    { title: '专家申请', link: '/dashboard/trainers/applications' }
  ],
  '/dashboard/trainers/cases': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '专家管理', link: '/dashboard/trainers' },
    { title: '案例管理', link: '/dashboard/trainers/cases' }
  ],
  '/dashboard/trainers/highlights': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '专家管理', link: '/dashboard/trainers' },
    { title: '精彩瞬间管理', link: '/dashboard/trainers/highlights' }
  ],
  '/dashboard/sensitive-words': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '系统管理', link: '#' },
    { title: '敏感词管理', link: '/dashboard/sensitive-words' }
  ],
  '/dashboard/institutions': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '机构管理', link: '/dashboard/institutions' }
  ],
  '/dashboard/institutions/applications': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '机构管理', link: '/dashboard/institutions' },
    { title: '机构申请', link: '/dashboard/institutions/applications' }
  ],
  '/dashboard/institutions/employees': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '机构管理', link: '/dashboard/institutions' },
    { title: '机构员工列表', link: '/dashboard/institutions/employees' }
  ],
  '/dashboard/institutions/employees/applications': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '机构管理', link: '/dashboard/institutions' },
    { title: '机构员工申请', link: '/dashboard/institutions/employees/applications' }
  ],
  '/dashboard/agents': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '专家经纪人管理', link: '/dashboard/agents' }
  ],
  '/dashboard/agents/applications': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '专家经纪人管理', link: '/dashboard/agents' },
    { title: '经纪人申请', link: '/dashboard/agents/applications' }
  ],
  '/dashboard/enterprise-agents': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '专家经纪公司管理', link: '/dashboard/enterprise-agents' }
  ],
  '/dashboard/enterprise-agents/applications': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '专家经纪公司管理', link: '/dashboard/enterprise-agents' },
    { title: '经纪公司申请', link: '/dashboard/enterprise-agents/applications' }
  ],
  '/dashboard/assistants': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '专家助理管理', link: '/dashboard/assistants' }
  ],
  '/dashboard/enterprise-buyers': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '企业采购方管理', link: '/dashboard/enterprise-buyers' }
  ],
  '/dashboard/notifications': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '通知管理', link: '/dashboard/notifications' }
  ],
  '/dashboard/notification-templates': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '通知模板管理', link: '/dashboard/notification-templates' }
  ],
  '/dashboard/notifications/send': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '通知管理', link: '/dashboard/notifications' },
    { title: '发送通知', link: '/dashboard/notifications/send' }
  ],
  '/dashboard/roles': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '角色管理', link: '/dashboard/roles' }
  ],
  '/dashboard/permissions': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '权限管理', link: '/dashboard/permissions' }
  ],
  '/dashboard/settings': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '系统管理', link: '#' },
    { title: '系统设置', link: '/dashboard/settings' }
  ],
  '/dashboard/product': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '课程管理', link: '/dashboard/product' }
  ]
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: SEGMENT_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
