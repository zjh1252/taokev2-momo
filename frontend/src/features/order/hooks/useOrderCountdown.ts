'use client';

import { useEffect, useRef, useState } from 'react';

function calcRemaining(expiredAt: string | null | undefined): number {
  if (!expiredAt) return 0;
  return Math.max(0, new Date(expiredAt).getTime() - Date.now());
}

/**
 * 未支付订单支付倒计时（毫秒），每秒刷新；归零时触发一次 onExpire
 */
export function useOrderCountdown(
  expiredAt: string | null | undefined,
  onExpire?: () => void,
): number {
  const [remaining, setRemaining] = useState(() => calcRemaining(expiredAt));
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    if (!expiredAt) return;
    let fired = false;
    const timer = setInterval(tick, 1000);

    function tick() {
      const r = calcRemaining(expiredAt);
      setRemaining(r);
      if (r <= 0) {
        clearInterval(timer);
        if (!fired) {
          fired = true;
          onExpireRef.current?.();
        }
      }
    }

    tick();
    return () => clearInterval(timer);
  }, [expiredAt]);

  return remaining;
}

/** 毫秒 → mm:ss */
export function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
