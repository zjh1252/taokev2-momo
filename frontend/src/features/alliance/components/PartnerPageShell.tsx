'use client';

import type { ReactNode } from 'react';

export function PartnerPageShell({ children }: { children: ReactNode }) {
  return (
    <section className="min-h-[500px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 py-4">
        <h2 className="font-bold text-gray-800">培训合伙人</h2>
      </div>
      {children}
    </section>
  );
}
