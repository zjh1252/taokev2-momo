'use client';

import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createEducationCert,
  deleteEducationCert,
  listEducationCerts,
  updateEducationCert,
  type EducationCert,
} from '@/features/user-center/api/cert-service';
import { CertProgressBar } from '@/features/user-center/components/cert-progress-bar';
import { CertFileUploader } from '@/features/user-center/components/cert-file-uploader';
import { CertStatusBadge } from '@/features/user-center/components/cert-status-badge';

/**
 * 学历认证页 — 多记录列表 + 新增/编辑表单 + 单条进度。
 *
 * @author Fangxinxin
 * @date 2026-04-16 19:00
 */
export default function EducationCertPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<EducationCert[]>([]);
  const [editing, setEditing] = useState<EducationCert | null>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await listEducationCerts();
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
      holderName: '',
      schoolName: '',
      major: '',
      degree: '',
      startDate: '',
      endDate: '',
      isGraduated: 1,
      proofFile: '',
    });
    setShowForm(true);
  };

  const handleEdit = (r: EducationCert) => {
    setEditing({ ...r });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除该学历认证记录？')) return;
    await deleteEducationCert(id);
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
          <div className="text-xl font-bold text-gray-900">学历认证</div>
          <div className="text-sm text-gray-500 mt-2">
            填写您的学习经历，可添加多条记录。每条记录单独审核。
          </div>
        </div>
        {!showForm && (
          <button
            type="button"
            onClick={handleNew}
            className="inline-flex items-center gap-1 bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="size-4" /> 新增学历
          </button>
        )}
      </div>

      {showForm && editing && (
        <EducationForm record={editing} onCancel={handleClose} onSaved={handleSaved} />
      )}

      {!showForm && (
        <>
          {loading ? (
            <div className="text-sm text-slate-400">加载中…</div>
          ) : records.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-200 px-6 py-12 text-center text-sm text-slate-400">
              暂无学历认证记录，点击右上角「新增学历」添加。
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
                      <span className="font-medium text-slate-800">{r.schoolName}</span>
                      <span className="text-slate-500 text-sm">{r.major}</span>
                      {r.degree && (
                        <span className="text-slate-400 text-xs">· {r.degree}</span>
                      )}
                      <CertStatusBadge status={r.status} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {r.startDate} ~ {r.endDate || '至今'}
                      {r.holderName && <span className="ml-3">持证人：{r.holderName}</span>}
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
  record: EducationCert;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}

function EducationForm({ record, onCancel, onSaved }: FormProps) {
  const [holderName, setHolderName] = useState(record.holderName || '');
  const [schoolName, setSchoolName] = useState(record.schoolName || '');
  const [major, setMajor] = useState(record.major || '');
  const [degree, setDegree] = useState(record.degree || '');
  const [startDate, setStartDate] = useState(record.startDate || '');
  const [endDate, setEndDate] = useState(record.endDate || '');
  const [proofFile, setProofFile] = useState(record.proofFile || '');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!record.id;

  const handleSubmit = async () => {
    if (!holderName.trim()) return toast.error('请输入持证人姓名');
    if (!schoolName.trim()) return toast.error('请输入院校名称');
    if (!major.trim()) return toast.error('请输入所学专业');
    if (!startDate) return toast.error('请选择入学日期');
    if (endDate && endDate < startDate) return toast.error('结束日期不能早于开始日期');
    if (!proofFile) return toast.error('请上传学历证明文件');

    setSubmitting(true);
    try {
      const payload = {
        holderName: holderName.trim(),
        schoolName: schoolName.trim(),
        major: major.trim(),
        degree: degree.trim(),
        startDate,
        endDate: endDate || null,
        isGraduated: 1,
        proofFile,
      };
      if (isEdit && record.id) {
        await updateEducationCert(record.id, payload);
        toast.success('已更新，重新进入待审核');
      } else {
        await createEducationCert(payload);
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
        {isEdit ? '编辑学历记录' : '新增学历记录'}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="持证人姓名" required>
          <input
            className="form-input"
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            placeholder="证书上的姓名"
          />
        </Field>
        <Field label="院校名称" required>
          <input
            className="form-input"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />
        </Field>
        <Field label="所学专业" required>
          <input
            className="form-input"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
          />
        </Field>
        <Field label="学历">
          <input
            className="form-input"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            placeholder="如：本科 / 硕士"
          />
        </Field>
        <Field label="入学日期" required>
          <input
            type="date"
            placeholder="年 / 月 / 日"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>
        <Field label="结束日期">
          <input
            type="date"
            placeholder="年 / 月 / 日"
            className="form-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Field>
      </div>

      <div>
        <div className="text-sm text-gray-600 mb-2">
          学历证明文件 <span className="text-red-500">*</span>
        </div>
        <CertFileUploader
          value={proofFile}
          onChange={setProofFile}
          label="学历证明"
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
            label="本条学历认证"
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
