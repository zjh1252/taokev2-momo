'use client';

import { useCallback, useEffect, useRef } from 'react';
import { getPxbSelectionUrl } from '@/lib/pxb-embed';

const CONTENT_ID = 'pxb_content';

/** 对齐老站 PageHeight.js：向培训宝 selection 页回传 iframe 内容高度 */
export function PxbIframeHeightReporter() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const selectionUrl = getPxbSelectionUrl();

  const reportHeight = useCallback(() => {
    const root = document.getElementById(CONTENT_ID);
    const iframe = iframeRef.current;
    if (!root || !iframe) return;
    const height = root.offsetHeight + 10;
    const sep = selectionUrl.includes('?') ? '&' : '?';
    iframe.src = `${selectionUrl}${sep}height=${height}&t=${Date.now()}`;
  }, [selectionUrl]);

  useEffect(() => {
    reportHeight();
    const root = document.getElementById(CONTENT_ID);
    if (!root || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => reportHeight());
    observer.observe(root);
    return () => observer.disconnect();
  }, [reportHeight]);

  return (
    <iframe
      ref={iframeRef}
      id="ifr_selection"
      name="ifr_selection"
      title=""
      src=""
      width={0}
      height={0}
      style={{ display: 'none' }}
    />
  );
}
