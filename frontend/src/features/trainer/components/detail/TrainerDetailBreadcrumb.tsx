'use client';

import { useEffect, useState } from 'react';
import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { readTrainerListReturnPath } from '../../utils/list-return';

/**
 * 专家详情面包屑：返回「培训专家」时尽量回到进入详情前的列表 URL（含页码/筛选）。
 */
export function TrainerDetailBreadcrumb({ trainerName }: { trainerName: string }) {
  const [listHref, setListHref] = useState('/trainer');

  useEffect(() => {
    setListHref(readTrainerListReturnPath('/trainer'));
  }, []);

  return (
    <PageBreadcrumb
      items={[
        { label: '培训专家', href: listHref },
        { label: trainerName || '专家详情' },
      ]}
    />
  );
}
