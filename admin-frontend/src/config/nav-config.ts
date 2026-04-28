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
        title: '培训评价管理',
        url: '/dashboard/training-reviews',
        icon: 'star',
        isActive: false,
        items: []
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
          },
          // 资质认证管理（含 4 个孙菜单）
          {
            title: '资质认证管理',
            url: '#',
            items: [
              {
                title: '实名认证',
                url: '/dashboard/trainers/certifications/real-name'
              },
              {
                title: '专业认证',
                url: '/dashboard/trainers/certifications/professional'
              },
              {
                title: '学历认证',
                url: '/dashboard/trainers/certifications/education'
              },
              {
                title: '工作认证',
                url: '/dashboard/trainers/certifications/work'
              }
            ]
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
          },
          {
            title: '机构员工列表',
            url: '/dashboard/institutions/employees'
          },
          {
            title: '资质认证管理',
            url: '#',
            items: [
              {
                title: '公司资料审核',
                url: '/dashboard/institutions/certifications/company-info'
              }
            ]
          }
          // 机构员工申请已下放至机构在用户中心审核，平台不再受理
        ]
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: '专家经纪人管理',
        url: '#',
        icon: 'userCheck',
        isActive: false,
        items: [
          {
            title: '经纪人列表',
            url: '/dashboard/agents'
          },
          {
            title: '资质认证管理',
            url: '#',
            items: [
              {
                title: '工作认证审核',
                url: '/dashboard/agents/certifications/work'
              }
            ]
          }
          // 经纪人申请已下放至经纪公司在用户中心审核，平台不再受理
        ]
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: '专家经纪公司管理',
        url: '#',
        icon: 'briefcase',
        isActive: false,
        items: [
          {
            title: '经纪公司列表',
            url: '/dashboard/enterprise-agents'
          },
          {
            title: '经纪公司申请',
            url: '/dashboard/enterprise-agents/applications'
          },
          {
            title: '资质认证管理',
            url: '#',
            items: [
              {
                title: '资质认证审核',
                url: '/dashboard/enterprise-agents/certifications/qualification'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: '专家助理管理',
        url: '/dashboard/assistants',
        icon: 'headset',
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: '需求管理',
        url: '/dashboard/demands',
        icon: 'forms',
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: '留言管理',
        url: '/dashboard/trainer-messages',
        icon: 'message',
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: '企业采购方管理',
        url: '/dashboard/enterprise-buyers',
        icon: 'briefcase',
        isActive: false,
        items: []
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
          },
          {
            title: '全文搜索管理',
            url: '/dashboard/search'
          }
        ]
      }
    ]
  }
];
