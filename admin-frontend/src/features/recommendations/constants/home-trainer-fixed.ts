/** 首页推荐专家前两张大卡固定展示数据（与 C 端 mock 一致） */
export type HomeTrainerFixedSlot = 'main' | 'middle';

export type HomeTrainerFixedExpert = {
  slot: HomeTrainerFixedSlot;
  id: number;
  name: string;
  title: string;
  subtitle: string;
  badge?: string;
  avatar: string;
  coverImage: string;
  bio: string;
  chiefIntro: string;
  expertise: string;
  keyTags: string;
  coverUrl: string;
  listedAt: string;
  adminNote: string;
};

export const HOME_TRAINER_FIXED_EXPERTS: Record<HomeTrainerFixedSlot, HomeTrainerFixedExpert> = {
  main: {
    slot: 'main',
    id: 1,
    name: '张敬之',
    title: '战略咨询导师',
    subtitle: '前麦肯锡全球合伙人 / 20年企业转型经验',
    badge: '首席专家',
    avatar: '/statics/images/expert-main.jpg',
    coverImage: '/statics/images/expert-main.jpg',
    bio: '深度辅导过超过50家世界500强企业，独创"动态战略演进模型"。',
    chiefIntro:
      '深度辅导过超过50家世界500强企业，独创"动态战略演进模型"，专注于复杂商业环境下的组织战略诊断、顶层设计与数字化领导力提升，帮助企业实现跨越式增长。',
    expertise: '战略规划',
    keyTags: '战略规划,组织变革,领导力',
    coverUrl: '/statics/images/expert-main.jpg',
    listedAt: '2026-01-01 00:00:00',
    adminNote: '首页首席大卡固定展示'
  },
  middle: {
    slot: 'middle',
    id: 2,
    name: 'Robert Han',
    title: '组织战略顾问',
    subtitle: '',
    avatar: '/statics/images/expert-robert.jpg',
    coverImage: '/statics/images/expert-robert.jpg',
    bio: '前世界500强亚太区首席顾问，专注组织战略诊断与数字化领导力提升。',
    chiefIntro: '前世界500强亚太区首席顾问，专注组织战略诊断与数字化领导力提升。',
    expertise: '战略执行',
    keyTags: '战略执行,组织诊断',
    coverUrl: '/statics/images/expert-robert.jpg',
    listedAt: '2026-01-01 00:00:00',
    adminNote: '首页中间深色大卡固定展示'
  }
};

export const HOME_TRAINER_SIDE_LIMIT = 2;
export const HOME_TRAINER_TOTAL_SLOTS = 4;
