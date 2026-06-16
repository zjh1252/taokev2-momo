/** 机构模块 — 前端类型定义 */

/** 机构列表项（对应后端 InstitutionListItemResponse） */
export interface InstitutionListItem {
  id: number;
  orgName: string;
  specialties?: string;
  industries?: string;
  bio?: string;
  logoUrl?: string;
  provinceId: number;
  cityId: number;
  score: number;
  viewCount: number;
  commentCount: number;
  openCourseCount: number;
  innerCourseCount: number;
  isCertified: number;
  isRecommended: number;
}

/** 机构公开详情（对应后端 InstitutionPublicResponse） */
export interface InstitutionDetail {
  id: number;
  orgName: string;
  orgType: number;
  bio?: string;
  specialties?: string;
  industries?: string;
  logoUrl?: string;
  bannerUrl?: string;
  provinceId: number;
  cityId: number;
  districtId: number;
  /** 省份名称（详情接口回填） */
  provinceName?: string;
  /** 城市名称（详情接口回填） */
  cityName?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  showContact: number;
  score: number;
  viewCount: number;
  commentCount: number;
  openCourseCount: number;
  innerCourseCount: number;
  isCertified: number;
  isRecommended: number;
  /** 服务过的客户描述（部分客户，长文本） */
  clientCases?: string;
  /** 成功案例（长文本） */
  successCases?: string;
  createdAt: string;
}

/** 通用分页响应 */
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/** 后端统一响应包装 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
