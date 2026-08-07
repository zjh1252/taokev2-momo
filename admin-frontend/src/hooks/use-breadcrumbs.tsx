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
  users: '个人学员',
  courses: '课程管理',
  plans: '排课管理',
  'training-reviews': '评价管理',
  videos: '视频列表',
  new: '添加',
  'video-orders': '订单管理',
  'video-comments': '评论管理',
  'video-invoices': '发票管理',
  'video-suppliers': '供应商管理',
  trainers: '专家',
  cases: '案例管理',
  highlights: '精彩瞬间管理',
  books: '著作管理',
  list: '著作列表',
  institutions: '机构',
  employees: '机构员工',
  agents: '专家经纪人',
  'enterprise-agents': '专家经纪公司',
  assistants: '专家助理',
  'enterprise-buyers': '企业采购方',
  demands: '需求管理',
  'open-course-enrollments': '公开课报名',
  orders: '订单管理',
  notifications: '通知管理',
  'notification-templates': '通知模板管理',
  send: '发送通知',
  roles: '角色管理',
  permissions: '权限管理',
  advertisements: '广告管理',
  settings: '系统设置',
  'sensitive-words': '敏感词管理',
  search: '全文搜索管理',
  contracts: '合约管理',
  ambassador: '推广大使',
  partners: '培训合伙人',
  '721': '721讲师合作',
  applications: '申请管理',
  categories: '分类管理',
  'course-category': '课程分类',
  'trainer-expertise': '专家擅长领域',
  'trainer-industry': '专家擅长行业'
};

const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/overview': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '总览', link: '/dashboard/overview' }
  ],

  // 用户管理
  '/dashboard/users': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '#' },
    { title: '个人学员', link: '/dashboard/users' }
  ],
  '/dashboard/trainers': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '#' },
    { title: '专家', link: '/dashboard/trainers' }
  ],
  '/dashboard/trainers/new': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '#' },
    { title: '专家', link: '/dashboard/trainers' },
    { title: '添加专家', link: '/dashboard/trainers/new' }
  ],
  '/dashboard/trainers/applications': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '#' },
    { title: '专家', link: '/dashboard/trainers' },
    { title: '专家申请', link: '/dashboard/trainers/applications' }
  ],
  '/dashboard/enterprise-buyers': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '#' },
    { title: '企业采购方', link: '/dashboard/enterprise-buyers' }
  ],
  '/dashboard/assistants': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '#' },
    { title: '专家助理', link: '/dashboard/assistants' }
  ],
  '/dashboard/agents': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '#' },
    { title: '专家经纪人', link: '/dashboard/agents' }
  ],
  '/dashboard/enterprise-agents': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '#' },
    { title: '专家经纪公司', link: '/dashboard/enterprise-agents' }
  ],
  '/dashboard/enterprise-agents/applications': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '#' },
    { title: '专家经纪公司', link: '/dashboard/enterprise-agents' },
    { title: '经纪公司申请', link: '/dashboard/enterprise-agents/applications' }
  ],
  '/dashboard/institutions': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '#' },
    { title: '机构', link: '/dashboard/institutions' }
  ],
  '/dashboard/institutions/applications': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '#' },
    { title: '机构', link: '/dashboard/institutions' },
    { title: '机构申请', link: '/dashboard/institutions/applications' }
  ],
  '/dashboard/institutions/employees': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '用户管理', link: '#' },
    { title: '机构', link: '/dashboard/institutions' },
    { title: '机构员工', link: '/dashboard/institutions/employees' }
  ],

  // 内容资源运营
  '/dashboard/courses': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '课程管理', link: '/dashboard/courses' }
  ],
  '/dashboard/courses/new': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '课程管理', link: '/dashboard/courses' },
    { title: '添加课程', link: '/dashboard/courses/new' }
  ],
  '/dashboard/courses/plans': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '课程管理', link: '/dashboard/courses' },
    { title: '排课管理', link: '/dashboard/courses/plans' }
  ],
  '/dashboard/videos': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '录播课管理', link: '/dashboard/videos' },
    { title: '视频列表', link: '/dashboard/videos' }
  ],
  '/dashboard/videos/new': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '录播课管理', link: '/dashboard/videos' },
    { title: '添加视频', link: '/dashboard/videos/new' }
  ],
  '/dashboard/video-orders': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '录播课管理', link: '/dashboard/videos' },
    { title: '订单管理', link: '/dashboard/video-orders' }
  ],
  '/dashboard/video-comments': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '录播课管理', link: '/dashboard/videos' },
    { title: '评论管理', link: '/dashboard/video-comments' }
  ],
  '/dashboard/video-invoices': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '录播课管理', link: '/dashboard/videos' },
    { title: '发票管理', link: '/dashboard/video-invoices' }
  ],
  '/dashboard/video-suppliers': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '录播课管理', link: '/dashboard/videos' },
    { title: '供应商管理', link: '/dashboard/video-suppliers' }
  ],
  '/dashboard/trainers/cases': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '案例管理', link: '/dashboard/trainers/cases' }
  ],
  '/dashboard/trainers/cases/new': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '案例管理', link: '/dashboard/trainers/cases' },
    { title: '添加案例', link: '/dashboard/trainers/cases/new' }
  ],
  '/dashboard/trainers/highlights': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '精彩瞬间管理', link: '/dashboard/trainers/highlights' }
  ],
  '/dashboard/trainers/highlights/new': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '精彩瞬间管理', link: '/dashboard/trainers/highlights' },
    { title: '添加精彩瞬间', link: '/dashboard/trainers/highlights/new' }
  ],
  '/dashboard/books/list': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '著作管理', link: '/dashboard/books/list' },
    { title: '著作列表', link: '/dashboard/books/list' }
  ],
  '/dashboard/books/list/new': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '著作管理', link: '/dashboard/books/list' },
    { title: '添加著作', link: '/dashboard/books/list/new' }
  ],
  '/dashboard/works': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '著作管理', link: '/dashboard/works' }
  ],
  '/dashboard/training-reviews': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '内容资源运营', link: '#' },
    { title: '评价管理', link: '/dashboard/training-reviews' }
  ],

  // 需求管理
  '/dashboard/demands': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '需求管理', link: '/dashboard/demands' }
  ],

  // 公开课报名
  '/dashboard/open-course-enrollments': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '平台运营管理', link: '#' },
    { title: '公开课报名', link: '/dashboard/open-course-enrollments' }
  ],

  // 订单管理
  '/dashboard/orders': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '订单管理', link: '/dashboard/orders' }
  ],

  // 通知管理
  '/dashboard/notification-templates': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '通知管理', link: '/dashboard/notification-templates' }
  ],
  '/dashboard/notifications/send': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '通知管理', link: '/dashboard/notification-templates' },
    { title: '发送通知', link: '/dashboard/notifications/send' }
  ],

  // 角色管理
  '/dashboard/roles': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '角色管理', link: '/dashboard/roles' }
  ],

  // 权限管理
  '/dashboard/permissions': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '权限管理', link: '/dashboard/permissions' }
  ],

  // 广告管理
  '/dashboard/advertisements': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '广告管理', link: '/dashboard/advertisements' }
  ],

  // 系统管理
  '/dashboard/settings': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '系统管理', link: '#' },
    { title: '系统设置', link: '/dashboard/settings' }
  ],
  '/dashboard/sensitive-words': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '系统管理', link: '#' },
    { title: '敏感词管理', link: '/dashboard/sensitive-words' }
  ],
  '/dashboard/search': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '系统管理', link: '#' },
    { title: '全文搜索管理', link: '/dashboard/search' }
  ],
  '/dashboard/contracts': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '系统管理', link: '#' },
    { title: '合约管理', link: '/dashboard/contracts' }
  ],
  '/dashboard/contracts/partners': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '系统管理', link: '#' },
    { title: '合约管理', link: '/dashboard/contracts/partners' },
    { title: '培训合伙人', link: '/dashboard/contracts/partners' }
  ],
  '/dashboard/contracts/ambassador': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '系统管理', link: '#' },
    { title: '合约管理', link: '/dashboard/contracts/partners' },
    { title: '推广大使', link: '/dashboard/contracts/ambassador' }
  ],
  '/dashboard/contracts/721': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: '系统管理', link: '#' },
    { title: '合约管理', link: '/dashboard/contracts/partners' },
    { title: '721讲师合作', link: '/dashboard/contracts/721' }
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
