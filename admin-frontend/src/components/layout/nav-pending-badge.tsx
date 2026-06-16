'use client';

import { Badge } from '@/components/ui/badge';
import { pendingCountsQueryOptions } from '@/features/stats/api/queries';
import { useQuery } from '@tanstack/react-query';

type NavPendingBadgeProps = {
  url: string;
};

export function NavPendingBadge({ url }: NavPendingBadgeProps) {
  const { data: counts } = useQuery(pendingCountsQueryOptions());
  const count = counts?.[url] ?? 0;
  if (!count || count <= 0) return null;

  return (
    <Badge
      variant='destructive'
      className='ml-auto h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]'
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
}
