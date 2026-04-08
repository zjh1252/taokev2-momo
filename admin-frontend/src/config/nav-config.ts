import { NavGroup } from '@/types';

/**
 * 后台管理系统侧边栏导航配置
 *
 * 按业务模块分组，每个 NavGroup 渲染为一个 SidebarGroupLabel。
 */
export const navGroups: NavGroup[] = [
  {
    label: '总览',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      }
    ]
  },
  {
    label: '用户管理',
    items: [
      {
        title: '用户列表',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: '课程管理',
    items: [
      {
        title: '课程管理',
        url: '#',
        icon: 'book',
        isActive: false,
        items: [
          {
            title: '课程列表',
            url: '/dashboard/courses'
          },
          {
            title: '排课管理',
            url: '/dashboard/courses/plans'
          }
        ]
      }
    ]
  },
  {
    label: '录播课管理',
    items: [
      {
        title: '录播课管理',
        url: '#',
        icon: 'video',
        isActive: false,
        items: [
          {
            title: '录播课列表',
            url: '/dashboard/videos'
          }
        ]
      }
    ]
  },
  {
    label: '专家管理',
    items: [
      {
        title: '专家管理',
        url: '#',
        icon: 'user',
        isActive: false,
        items: [
          {
            title: '专家列表',
            url: '/dashboard/trainers'
          },
          {
            title: '专家申请',
            url: '/dashboard/trainers/applications'
          }
        ]
      }
    ]
  },
  {
    label: '分类管理',
    items: [
      {
        title: '分类管理',
        url: '#',
        icon: 'tags',
        isActive: false,
        items: [
          {
            title: '课程分类',
            url: '/dashboard/categories/course-category'
          },
          {
            title: '专家擅长领域',
            url: '/dashboard/categories/trainer-expertise'
          },
          {
            title: '专家擅长行业',
            url: '/dashboard/categories/trainer-industry'
          }
        ]
      }
    ]
  },
  {
    label: '通知管理',
    items: [
      {
        title: '通知管理',
        url: '#',
        icon: 'notification',
        isActive: false,
        items: [
          {
            title: '通知模板管理',
            url: '/dashboard/notification-templates'
          },
          {
            title: '发送通知消息',
            url: '/dashboard/notifications/send'
          }
        ]
      }
    ]
  },
  {
    label: '权限设置',
    items: [
      {
        title: '角色管理',
        url: '/dashboard/roles',
        icon: 'lock',
        isActive: false,
        items: []
      },
      {
        title: '权限管理',
        url: '/dashboard/permissions',
        icon: 'permission',
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: '系统设置',
    items: [
      {
        title: '系统配置',
        url: '/dashboard/settings',
        icon: 'settings',
        isActive: false,
        items: []
      }
    ]
  }
];
