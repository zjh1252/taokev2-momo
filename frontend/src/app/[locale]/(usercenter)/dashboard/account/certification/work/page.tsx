'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DateInput } from '@/components/ui/date-input';
import {
  createWorkCert,
  deleteWorkCert,
  listWorkCerts,
  updateWorkCert,
  type WorkCert,
} from '@/features/user-center/api/cert-service';
import { CertProgressBar } from '@/features/user-center/components/cert-progress-bar';
import { CertFileUploader } from '@/features/user-center/components/cert-file-uploader';
import { CertStatusBadge } from '@/features/user-center/components/cert-status-badge';

/**
 * 工作认证页 — 多记录列表 + 新增/编辑表单 + 单条进度。
 *
 * @author Fangxinxin
 * @date 2026-04-16 19:30
 */
export default function WorkCertPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<WorkCert[]>([]);
  const [editing, setEditing] = useState<WorkCert | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await listWorkCerts();
      setRecords(resp.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const handleNew = () => {
    setEditing({
      companyName: '',
      position: '',
      startDate: '',
      endDate: '',
      jobDescription: '',
      proofFile: '',
    });
    setShowForm(true);
  };

  const handleEdit = (r: WorkCert) => {
    setEditing({ ...r });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该工作认证记录？')) return;
    await deleteWorkCert(id);
    toast.success('已删除');
    await fetchData();
  };

  const handleClose = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSaved = async () => {
    handleClose();
    await fetchData();
  };

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xl font-bold text-gray-900">工作认证</div>
          <div className="text-sm text-gray-500 mt-2">
            填写您的工作经历，可添加多条记录。每条记录单独审核。
          </div>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={handleNew}
            className="inline-flex items-center gap-1 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="size-4" /> 新增工作经历
          </button>
        )}
      </div>

      {showForm && editing && (
        <WorkForm record={editing} onCancel={handleClose} onSaved={handleSaved} />
      )}

      {!showForm && (
        <>
          {loading ? (
            <div className="text-sm text-slate-400">加载中…</div>
          ) : records.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-400">
              暂无工作认证记录，点击右上角「新增工作经历」添加。
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-md">
              {records.map((r) => (
                <li
                  key={r.id}
                  className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => handleEdit(r)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800">{r.companyName}</span>
                      <span className="text-slate-500 text-sm">{r.position}</span>
                      <CertStatusBadge status={r.status} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {r.startDate} ~ {r.endDate || '至今'}
                    </div>
                    {r.status === 3 && r.rejectReason && (
                      <div className="text-xs text-red-500 mt-1">
                        驳回原因：{r.rejectReason}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleEdit(r)}
                      className="text-slate-500 hover:text-primary hover:bg-primary/10 rounded p-1.5 transition-colors"
                      aria-label="编辑"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => r.id && handleDelete(r.id)}
                      className="text-slate-500 hover:text-red-500 hover:bg-red-50 rounded p-1.5 transition-colors"
                      aria-label="删除"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

interface FormProps {
  record: WorkCert;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}

function WorkForm({ record, onCancel, onSaved }: FormProps) {
  const [companyName, setCompanyName] = useState(record.companyName || '');
  const [position, setPosition] = useState(record.position || '');
  const [startDate, setStartDate] = useState(record.startDate || '');
  const [endDate, setEndDate] = useState(record.endDate || '');
  const [jobDescription, setJobDescription] = useState(record.jobDescription || '');
  const [proofFile, setProofFile] = useState(record.proofFile || '');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!record.id;

  const handleSubmit = async () => {
    if (!companyName.trim()) return toast.error('请输入单位名称');
    if (!position.trim()) return toast.error('请输入担任职务');
    if (!startDate) return toast.error('请选择起始时间');
    if (endDate && endDate < startDate) return toast.error('结束日期不能早于开始日期');
    if (!proofFile) return toast.error('请上传工作证明文件');

    setSubmitting(true);
    try {
      const payload = {
        companyName: companyName.trim(),
        position: position.trim(),
        startDate,
        endDate: endDate || null,
        jobDescription: jobDescription.trim(),
        proofFile,
      };
      if (isEdit && record.id) {
        await updateWorkCert(record.id, payload);
        toast.success('已更新，重新进入待审核');
      } else {
        await createWorkCert(payload);
        toast.success('已提交，等待审核');
      }
      await onSaved();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 border border-slate-200 rounded-lg p-5 bg-slate-50/40">
      <div className="text-base font-semibold text-slate-800">
        {isEdit ? '编辑工作记录' : '新增工作记录'}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="单位名称" required>
          <input
            className="form-input"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </Field>
        <Field label="担任职务" required>
          <input
            className="form-input"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </Field>
        <Field label="起始时间" required>
          <DateInput
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>
        <Field label="结束时间">
          <DateInput
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Field>
        <label className="text-sm md:col-span-2 block">
          <span className="block text-gray-600 mb-1">工作描述</span>
          <textarea
            className="form-input min-h-[80px]"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="可选填，简述该岗位的核心职责或成就"
          />
        </label>
      </div>

      <div>
        <div className="text-sm text-gray-600 mb-2">
          工作证明文件 <span className="text-red-500">*</span>
        </div>
        <CertFileUploader
          value={proofFile}
          onChange={setProofFile}
          label="工作证明"
          accept="image/*,.pdf"
        />
      </div>

      {isEdit && (
        <div className="border-t border-slate-200 pt-4">
          <div className="text-sm text-gray-700 font-bold mb-3">当前进度</div>
          <CertProgressBar
            status={record.status ?? null}
            submittedAt={null}
            auditedAt={record.auditedAt ?? null}
            rejectReason={record.rejectReason}
            label="本条工作认证"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-primary text-white px-6 py-2.5 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors font-bold"
        >
          {submitting ? '保存中…' : isEdit ? '保存修改' : '提交认证'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors text-sm"
        >
          取消
        </button>
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 14px;
          background: #fff;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm block">
      <span className="block text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
