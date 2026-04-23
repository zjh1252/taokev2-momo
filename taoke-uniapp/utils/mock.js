/**
 * 临时 mock 数据
 *
 * 用途：在后端接口未联通或字段尚未对齐时，让 UI 跑得起来；
 * 接口对接后逐项替换。
 */

export const MOCK_BANNER = {
  title: '提升企业核心竞争力',
  subtitle: '从优质内训开始 — 精选行业大咖，定制化课程方案',
  primaryAction: { text: '立即预约', url: '/pages/course/list' },
  secondaryAction: { text: '了解更多', url: '/pages/course/list' },
};

export const MOCK_LATEST_CASE =
  '某世界 500 强企业引入《卓越领导力》内训课程，满意度 98%';

export const MOCK_EXPERTS = [
  {
    id: 1,
    nickname: '张大卫',
    title: '资深领导力教练',
    avatar: 'https://avatars.githubusercontent.com/u/9919?v=4',
    rating: 5,
    verified: true,
    tags: ['领导力', '组织发展', '高管教练'],
    viewCount: 1280,
    favCount: 86,
  },
  {
    id: 2,
    nickname: '李雪梅',
    title: '敏捷管理专家',
    avatar: 'https://avatars.githubusercontent.com/u/1024025?v=4',
    rating: 4.5,
    verified: true,
    tags: ['敏捷', 'Scrum', '项目管理'],
    viewCount: 980,
    favCount: 64,
  },
  {
    id: 3,
    nickname: '王建国',
    title: '战略规划顾问',
    avatar: 'https://avatars.githubusercontent.com/u/6128107?v=4',
    rating: 4,
    verified: false,
    tags: ['战略', '商业模式'],
    viewCount: 612,
    favCount: 41,
  },
];

export const MOCK_COURSES = [
  {
    id: 101,
    title: '数智化转型背景下的组织效能提升与绩效管理',
    coverUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400',
    startDate: '10月24日',
    city: '上海',
    trainerName: '张大卫',
    price: 3980,
  },
  {
    id: 102,
    title: '高管演讲与呈现技巧：如何用故事打动人心',
    coverUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400',
    startDate: '11月05日',
    city: '北京',
    trainerName: '李雪梅',
    price: 4500,
  },
  {
    id: 103,
    title: '敏捷转型与高效团队打造',
    coverUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400',
    startDate: '11月18日',
    city: '深圳',
    trainerName: '王建国',
    price: 3680,
  },
];
