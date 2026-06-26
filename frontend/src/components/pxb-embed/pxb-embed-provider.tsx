'use client';

import { createContext, useContext, useMemo } from 'react';
import { PxbEmbedBodySetup } from './pxb-embed-body-setup';
import { PxbIframeHeightReporter } from './pxb-iframe-height-reporter';

const PxbEmbedContext = createContext(false);

export function usePxbEmbed(): boolean {
  return useContext(PxbEmbedContext);
}

export function PxbEmbedProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const value = useMemo(() => enabled, [enabled]);
  return (
    <PxbEmbedContext.Provider value={value}>
      {children}
      {enabled ? (
        <>
          <PxbEmbedBodySetup />
          <PxbIframeHeightReporter />
        </>
      ) : null}
    </PxbEmbedContext.Provider>
  );
}
