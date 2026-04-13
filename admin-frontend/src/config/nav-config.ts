import { NavGroup } from '@/types';

/**
 * 后台管理系统侧边栏导航配置
 *
 * 按业务模块分组，每个 NavGroup 渲染为一个 SidebarGroupLabel。
 * label 为空字符串时不渲染分组标题，避免与菜单项文字重复。
 */
export const navGroups: NavGroup[] = [
  {
    label: '',
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
    label: '',
    items: [
      {
        title: '用户管理',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: '',
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
    label: '',
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
    label: '',
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
          },
          {
            title: '案例管理',
            url: '/dashboard/trainers/cases'
          },
          {
            title: '精彩瞬间管理',
            url: '/dashboard/trainers/highlights'
          }
        ]
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: '机构管理',
        url: '#',
        icon: 'building',
        isActive: false,
        items: [
          {
            title: '机构列表',
            url: '/dashboard/institutions'
          },
          {
            title: '机构申请',
            url: '/dashboard/institutions/applications'
          }
        ]
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: '企业采购方管理',
        url: '#',
        icon: 'briefcase',
        isActive: false,
        items: [
          {
            title: '企业采购方列表',
            url: '/dashboard/enterprise-buyers'
          },
          {
            title: '企业采购方申请',
            url: '/dashboard/enterprise-buyers/applications'
          }
        ]
      }
    ]
  },
  {
    label: '',
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
    label: '',
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
    label: '',
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
    label: '',
    items: [
      {
        title: '系统管理',
        url: '#',
        icon: 'settings',
        isActive: false,
        items: [
          {
            title: '系统设置',
            url: '/dashboard/settings'
          },
          {
            title: '敏感词管理',
            url: '/dashboard/sensitive-words'
          }
        ]
      }
    ]
  }
];
