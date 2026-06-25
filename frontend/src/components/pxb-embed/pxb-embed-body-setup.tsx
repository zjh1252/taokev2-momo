'use client';

import { useEffect } from 'react';

/** embed 页取消 Tailwind body flex，避免挤压老版列表布局 */
export function PxbEmbedBodySetup() {
  useEffect(() => {
    const prevClass = document.body.className;
    document.body.classList.add('pxb-embed-active');
    return () => {
      document.body.className = prevClass;
    };
  }, []);
  return null;
}
