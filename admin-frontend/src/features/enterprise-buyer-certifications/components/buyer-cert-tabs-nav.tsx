'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

const BUYER_CERT_TABS = [
  { id: 'real-name', label: '实名认证' },
  { id: 'work', label: '工作认证' }
] as const;

export type BuyerCertTabId = (typeof BUYER_CERT_TABS)[number]['id'];

export function BuyerCertTabsNav({ activeTab }: { activeTab: BuyerCertTabId }) {
  return (
    <div className='mb-4 flex flex-wrap gap-2 border-b border-border pb-3'>
      {BUYER_CERT_TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/dashboard/enterprise-buyers/certifications?certTab=${tab.id}`}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm transition-colors',
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
