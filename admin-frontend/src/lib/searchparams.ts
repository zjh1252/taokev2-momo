import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
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
  sort: parseAsString,
  /** 培训评价管理：COURSE / TRAINER / INSTITUTION */
  reviewScope: parseAsString
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
