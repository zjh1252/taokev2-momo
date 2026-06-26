'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  getPxbSelectionUrl,
  measurePxbContentHeight,
  PXB_CONTENT_RESIZE_EVENT,
} from '@/lib/pxb-embed';

const CONTENT_ID = 'pxb_content';
const REPORT_DEBOUNCE_MS = 80;

/** 对齐老站 PageHeight.js：向培训宝 selection 页回传 iframe 内容高度 */
export function PxbIframeHeightReporter() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const selectionUrl = getPxbSelectionUrl();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHeightRef = useRef(0);

  const sendHeight = useCallback(
    (height: number) => {
      const iframe = iframeRef.current;
      if (!iframe || height <= 0 || height === lastHeightRef.current) return;
      lastHeightRef.current = height;
      const sep = selectionUrl.includes('?') ? '&' : '?';
      iframe.src = `${selectionUrl}${sep}height=${height}&t=${Date.now()}`;
    },
    [selectionUrl],
  );

  const reportHeight = useCallback(() => {
    const root = document.getElementById(CONTENT_ID);
    if (!root) return;
    sendHeight(measurePxbContentHeight(root));
  }, [sendHeight]);

  const scheduleReport = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      reportHeight();
    }, REPORT_DEBOUNCE_MS);
  }, [reportHeight]);

  const scheduleReportNextFrame = useCallback(() => {
    requestAnimationFrame(() => {
      reportHeight();
      requestAnimationFrame(reportHeight);
    });
  }, [reportHeight]);

  useEffect(() => {
    scheduleReport();
    scheduleReportNextFrame();

    const root = document.getElementById(CONTENT_ID);
    let observer: ResizeObserver | undefined;
    if (root && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => scheduleReport());
      observer.observe(root);
    }

    const onResize = () => scheduleReport();
    window.addEventListener('load', onResize);
    window.addEventListener(PXB_CONTENT_RESIZE_EVENT, onResize);
    document.fonts?.ready.then(() => scheduleReportNextFrame()).catch(() => {});

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      observer?.disconnect();
      window.removeEventListener('load', onResize);
      window.removeEventListener(PXB_CONTENT_RESIZE_EVENT, onResize);
    };
  }, [scheduleReport, scheduleReportNextFrame]);

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
