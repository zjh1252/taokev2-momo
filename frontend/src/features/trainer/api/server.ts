import { cache } from 'react';
import { getTrainerDetail } from './service';

/** 同一次 SSR 请求内 dedupe（generateMetadata + 页面组件） */
export const getTrainerDetailCached = cache((trainerId: number) =>
  getTrainerDetail(trainerId),
);
