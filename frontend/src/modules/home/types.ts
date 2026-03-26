/** 首页数据类型定义 */

export interface HeroCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Expert {
  id: number;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  rating: number;
  /** 统计标签，如 "128+ 内训案例" */
  statLabel: string;
  /** 统计类型，用于匹配 i18n key */
  statType: 'cases' | 'publicSessions' | 'servedOrgs' | 'companiesServed';
  statCount: number;
}

export interface CaseStudy {
  id: number;
  tag: string;
  title: string;
  description: string;
  image: string;
  /** 服务讲师 */
  instructorName?: string;
  featured?: boolean;
}

export interface InternalCourse {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  instructorName: string;
  instructorAvatar: string;
  successCaseCount: number;
}

export interface PublicCourse {
  id: number;
  title: string;
  image: string;
  organizer: string;
  instructor: string;
  city: string;
  startDate: string;
  durationDays: number;
}
