'use client';

import { useEffect, useState } from 'react';
import { getRealNameCert, type RealNameCert } from '../api/cert-service';

/**
 * 实名认证已通过（status=2）时锁定姓名/身份证号类字段，避免与认证信息不一致。
 */
export function useRealNameLock() {
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<RealNameCert | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRealNameCert()
      .then((resp) => {
        if (!cancelled) setCert(resp.data);
      })
      .catch(() => {
        if (!cancelled) setCert(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const locked = cert?.status === 2;

  return {
    loading,
    locked,
    realName: cert?.realName ?? '',
    idCardNo: cert?.idCardNo ?? '',
    cert,
  };
}
