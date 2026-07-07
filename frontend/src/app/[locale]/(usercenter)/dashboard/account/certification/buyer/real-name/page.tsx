'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { RealNameCert } from '@/features/user-center/api/cert-service';
import {
  getBuyerRealNameCert,
  submitBuyerRealNameCert
} from '@/features/user-center/api/role-cert-service';
import { CertProgressBar } from '@/features/user-center/components/cert-progress-bar';
import { CertFileUploader } from '@/features/user-center/components/cert-file-uploader';

export default function BuyerRealNameCertPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<RealNameCert | null>(null);

  const [realName, setRealName] = useState('');
  const [idCardNo, setIdCardNo] = useState('');
  const [idCardFront, setIdCardFront] = useState('');
  const [idCardBack, setIdCardBack] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await getBuyerRealNameCert();
      const d = resp.data;
      setData(d);
      setRealName(d.realName || '');
      setIdCardNo(d.idCardNo || '');
      setIdCardFront(d.idCardFront || '');
      setIdCardBack(d.idCardBack || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!realName.trim()) return toast.error('请输入真实姓名');
    if (!/^\d{15}$|^\d{17}[\dXx]$/.test(idCardNo)) return toast.error('身份证号格式不正确');
    if (!idCardFront) return toast.error('请上传身份证人像面');
    if (!idCardBack) return toast.error('请上传身份证国徽面');

    setSubmitting(true);
    try {
      await submitBuyerRealNameCert({
        realName: realName.trim(),
        idCardNo: idCardNo.trim(),
        idCardFront,
        idCardBack
      });
      toast.success('已提交实名认证，等待审核');
      await fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const readOnly = data?.status === 2;

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6 space-y-6">
      <div>
        <div className="text-xl font-bold text-gray-900">实名认证</div>
        <div className="text-sm text-gray-500 mt-2">
          身份证信息将严格保密，仅用于平台资质审核与必要的法律合规场景。
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">加载中…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm block">
              <span className="block text-gray-600 mb-1">
                真实姓名 <span className="text-red-500">*</span>
              </span>
              <input
                className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-50"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                disabled={readOnly}
                placeholder="请输入真实姓名"
              />
            </label>
            <label className="text-sm block">
              <span className="block text-gray-600 mb-1">
                身份证号 <span className="text-red-500">*</span>
              </span>
              <input
                className="w-full border border-slate-300 rounded px-3 py-2 disabled:bg-slate-50"
                value={idCardNo}
                onChange={(e) => setIdCardNo(e.target.value)}
                disabled={readOnly}
                placeholder="15 或 18 位身份证号"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-2">
                身份证人像面 <span className="text-red-500">*</span>
              </div>
              {readOnly ? (
                idCardFront && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={idCardFront}
                    alt="身份证人像面"
                    className="size-32 rounded-lg object-cover border border-slate-200"
                  />
                )
              ) : (
                <CertFileUploader
                  value={idCardFront}
                  onChange={setIdCardFront}
                  label="身份证人像面"
                />
              )}
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">
                身份证国徽面 <span className="text-red-500">*</span>
              </div>
              {readOnly ? (
                idCardBack && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={idCardBack}
                    alt="身份证国徽面"
                    className="size-32 rounded-lg object-cover border border-slate-200"
                  />
                )
              ) : (
                <CertFileUploader
                  value={idCardBack}
                  onChange={setIdCardBack}
                  label="身份证国徽面"
                />
              )}
            </div>
          </div>

          {!readOnly && (
            <div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-primary text-white px-6 py-3 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors font-bold"
              >
                {submitting
                  ? '提交中…'
                  : data?.status === 3
                    ? '重新提交'
                    : '提交认证'}
              </button>
            </div>
          )}

          <div className="border-t border-slate-100 pt-5">
            <div className="text-sm text-gray-700 font-bold mb-3">认证进度</div>
            <CertProgressBar
              status={data?.status ?? null}
              submittedAt={data?.submittedAt ?? null}
              auditedAt={data?.auditedAt ?? null}
              rejectReason={data?.rejectReason}
              label="实名认证"
            />
          </div>
        </>
      )}
    </section>
  );
}
