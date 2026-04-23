'use client';

import { useEffect, useState } from 'react';
import { FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  getProfessionalCert,
  submitProfessionalCert,
  uploadCertFile,
  type ProfessionalCert,
} from '@/features/user-center/api/cert-service';
import { CertProgressBar } from '@/features/user-center/components/cert-progress-bar';

/**
 * 专业认证页 — 多附件（资质证书）上传 + 进度条。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:45
 */
export default function ProfessionalCertPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState<ProfessionalCert | null>(null);
  const [files, setFiles] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await getProfessionalCert();
      setData(resp.data);
      setFiles(resp.data.files || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const readOnly = data?.status === 2;

  const handleAddFiles = async (fileList: FileList) => {
    if (!fileList.length) return;
    setUploading(true);
    try {
      const next = [...files];
      for (const f of Array.from(fileList)) {
        const url = await uploadCertFile(f);
        next.push(url);
      }
      setFiles(next);
      // 上传完成后缩略图会立即出现，无需额外 toast，避免与「提交成功」重复
    } catch {
      toast.error('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return toast.error('请至少上传一份专业认证附件');
    setSubmitting(true);
    try {
      await submitProfessionalCert({ files });
      toast.success('已提交专业认证，等待审核');
      await fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6 space-y-6">
      <div>
        <div className="text-xl font-bold text-gray-900">专业认证</div>
        <div className="text-sm text-gray-500 mt-2">
          上传与您专业能力相关的证书、获奖证明、行业资质等附件，可上传多份。
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">加载中…</div>
      ) : (
        <>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              已上传附件 <span className="text-slate-400">({files.length})</span>
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {files.map((url, idx) => {
                  const isImg = /\.(png|jpe?g|gif|webp|bmp)(\?|$)/i.test(url);
                  return (
                    <div
                      key={`${url}-${idx}`}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50"
                    >
                      {isImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="附件" className="size-full object-cover" />
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="size-full flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-primary"
                        >
                          <FileText className="size-8" />
                          <span className="text-[11px]">查看文件</span>
                        </a>
                      )}
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                          aria-label="移除附件"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {!readOnly && (
              <label
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 hover:border-primary hover:bg-primary/5 px-4 py-8 cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  multiple
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                  disabled={uploading}
                  onChange={(e) => e.target.files && handleAddFiles(e.target.files)}
                />
                <span className="text-sm text-gray-500">
                  {uploading ? '正在上传…' : '点击或拖拽添加附件'}
                </span>
                <span className="text-xs text-gray-400">支持图片 / PDF / Word</span>
              </label>
            )}
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
              label="专业认证"
            />
          </div>
        </>
      )}
    </section>
  );
}
