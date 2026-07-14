'use client';

import { PartnerApplyForm } from '@/features/alliance/components/PartnerApplyForm';
import { PartnerPageShell } from '@/features/alliance/components/PartnerPageShell';

export default function PartnerPage() {
  return (
    <PartnerPageShell>
      <PartnerApplyForm />
    </PartnerPageShell>
  );
}
