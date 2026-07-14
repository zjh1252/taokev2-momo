'use client';

import { PartnerApplyForm } from '@/features/alliance/components/PartnerApplyForm';
import { PartnerPageShell } from '@/features/alliance/components/PartnerPageShell';
import { PartnerStatusPanel } from '@/features/alliance/components/PartnerStatusPanel';
import {
  getPartnerApplicationStatus,
  shouldShowPartnerStatusPanel,
} from '@/features/alliance/partner-application';

export default function PartnerPage() {
  const snapshot = getPartnerApplicationStatus();

  return (
    <PartnerPageShell>
      {shouldShowPartnerStatusPanel(snapshot.status) ? (
        <PartnerStatusPanel
          status={snapshot.status}
          partnerCode={snapshot.partnerCode ?? ''}
        />
      ) : (
        <PartnerApplyForm />
      )}
    </PartnerPageShell>
  );
}
