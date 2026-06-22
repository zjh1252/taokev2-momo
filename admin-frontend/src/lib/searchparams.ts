import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral
} from 'nuqs/server';

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  // 用户管理
  nickname: parseAsString,
  status: parseAsString,
  // 产品（暂保留）
  name: parseAsString,
  gender: parseAsString,
  category: parseAsString,
  enabled: parseAsString,
  role: parseAsString,
  regOrigin: parseAsString,
  realNameCertStatus: parseAsString,
  sort: parseAsString,
  /** 培训评价管理 */
  reviewScope: parseAsString,
  reviewerKeyword: parseAsString,
  reviewedBy: parseAsString,
  /** 素材库 */
  tab: parseAsStringLiteral(['cover', 'avatar']).withDefault('cover'),
  scene: parseAsString,
  isDefault: parseAsString
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
