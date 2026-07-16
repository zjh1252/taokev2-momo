import { cache } from 'react';
import { getActiveCities, getCityByEnName } from './service';

/**
 * 同一次 SSR 请求内 dedupe（generateMetadata + 页面组件）。
 * 城市频道综合页与 /city/[city]/* 子频道共用，避免每个城市页打两次解析接口。
 */
export const getCityByEnNameCached = cache((enName: string) => getCityByEnName(enName));

/** 首页卡片 / 城市导航栅格共用，同请求去重 */
export const getActiveCitiesCached = cache((limit: number) => getActiveCities(limit));
