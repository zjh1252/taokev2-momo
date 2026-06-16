'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  getEnterpriseAgentCert,
  submitEnterpriseAgentCert,
  type EnterpriseAgentCert,
} from '@/features/user-center/api/role-cert-service';
import { CertProgressBar } from '@/features/user-center/components/cert-progress-bar';
import { CertFileUploader } from '@/features/user-center/components/cert-file-uploader';

/**
 * 经纪公司「资质认证」页 — 单页表单（公司Logo + 营业执照）+ 整体审核进度。
 *
 * @author Fangxinxin
 * @date 2026-04-16 19:30
 */
export default function AgencyQualificationCertPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EnterpriseAgentCert | null>(null);
  const [certLogoUrl, setCertLogoUrl] = useState('');
  const [qualificationDocUrl, setQualificationDocUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await getEnterpriseAgentCert();
      const d = resp.data;
      setData(d);
      setCertLogoUrl(d?.certLogoUrl || '');
      setQualificationDocUrl(d?.qualificationDocUrl || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const isPending = data?.status === 1;

  const handleSubmit = async () => {
    if (!certLogoUrl) return toast.error('请上传公司 Logo');
    if (!qualificationDocUrl) return toast.error('请上传营业执照');
    setSubmitting(true);
    try {
      await submitEnterpriseAgentCert({ certLogoUrl, qualificationDocUrl });
      toast.success('已提交，等待审核');
      await fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[300px] p-6 text-sm text-slate-400">
        加载中…
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6 space-y-6">
      <div>
        <div className="text-xl font-bold text-gray-900">资质认证</div>
        <div className="text-sm text-gray-500 mt-2">
          请上传公司 Logo 与营业执照，平台审核通过后将作为公司资质对外展示。
          {isPending && (
            <span className="ml-2 text-amber-600">当前认证审核中，仍可修改并重新提交。</span>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <div className="text-sm text-gray-600 mb-2">
            公司 Logo <span className="text-red-500">*</span>
          </div>
          <CertFileUploader
            value={certLogoUrl}
            onChange={setCertLogoUrl}
            label="公司 Logo"
            accept="image/*"
          />
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-2">
            营业执照 <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-slate-400">支持图片或 PDF</span>
          </div>
          <CertFileUploader
            value={qualificationDocUrl}
            onChange={setQualificationDocUrl}
            label="营业执照"
            accept="image/*,.pdf"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-primary text-white px-6 py-2.5 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors font-bold"
        >
          {submitting ? '保存中…' : data?.status == null ? '提交认证' : '保存并重新审核'}
        </button>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="text-sm text-gray-700 font-bold mb-3">当前进度</div>
        <CertProgressBar
          status={data?.status ?? null}
          submittedAt={data?.submittedAt}
          auditedAt={data?.auditedAt}
          rejectReason={data?.rejectReason}
          label="资质认证"
        />
      </div>
    </section>
  );
}
