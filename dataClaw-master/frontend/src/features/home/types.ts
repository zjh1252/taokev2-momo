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
  tags: string[];
  /** 主推专家使用大图 */
  coverImage?: string;
  /** 副标题（如"战略咨询导师"） */
  subtitle?: string;
  /** 专家等级/徽章（如"首席专家"） */
  badge?: string;
}

export interface CaseStudy {
  id: number;
  tag: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
}

export interface InternalCourse {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  instructorName: string;
  instructorAvatar: string;
  instructorDesc: string;
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
