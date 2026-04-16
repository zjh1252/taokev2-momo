'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/config/routes';
import { ApplyStepLayout } from '@/features/role-apply/components/ApplyStepLayout';
import { useRoleApplyState } from '@/features/role-apply/hooks/useRoleApplyState';
import { submitRoleApply } from '@/features/role-apply/api/service';
import { APPLYABLE_ROLES, type ApplyableRole } from '@/features/role-apply/api/types';
import { validateRoleForm, getFirstError, type ValidationError } from '@/features/role-apply/utils/validation';
import {
  EnterpriseBuyerForm,
  TrainerApplyForm,
  AgentApplyForm,
  AssistantApplyForm,
  EnterpriseAgentForm,
  InstitutionApplyForm,
  InstitutionEmployeeForm,
} from '@/features/role-apply/components/role-forms';

const FORM_MAP: Record<ApplyableRole, React.ComponentType<{ data: any; onChange: (d: any) => void }>> = {
  ENTERPRISE_BUYER: EnterpriseBuyerForm,
  TRAINER: TrainerApplyForm,
  AGENT: AgentApplyForm,
  ASSISTANT: AssistantApplyForm,
  ENTERPRISE_AGENT: EnterpriseAgentForm,
  INSTITUTION: InstitutionApplyForm,
  INSTITUTION_EMPLOYEE: InstitutionEmployeeForm,
};

/**
 * 角色申请表单页 — 动态路由 /dashboard/apply/[role]
 *
 * @author Fangxinxin
 * @date 2026-04-03 16:30
 */
export default function RoleApplyPage({ params }: { params: Promise<{ role: string }> }) {
  const { role: roleParam } = use(params);
  const router = useRouter();
  const { state, setFormData, clearState } = useRoleApplyState();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const role = roleParam.toUpperCase() as ApplyableRole;
  const roleMeta = APPLYABLE_ROLES.find((r) => r.code === role);
  const FormComponent = FORM_MAP[role];

  if (!roleMeta || !FormComponent) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6">
        <div className="text-center py-20">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">无效的角色</h2>
          <p className="text-gray-500 mb-6">请从角色选择页面重新选择</p>
          <button
            type="button"
            onClick={() => router.push(ROUTES.UC_APPLY)}
            className="h-10 px-6 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors cursor-pointer"
          >
            返回选择角色
          </button>
        </div>
      </section>
    );
  }

  const formData = state.formData || {};

  const handleFormChange = (data: Record<string, unknown>) => {
    setFormData(data);
  };

  const handleBack = () => {
    router.push(ROUTES.UC_APPLY);
  };

  const handleSubmit = async () => {
    setError('');
    setValidationErrors([]);

    // 表单验证
    const validation = validateRoleForm(role, formData);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      const firstError = getFirstError(validation.errors);
      setError(firstError || '请完善必填信息');
      return;
    }

    setSubmitting(true);
    try {
      await submitRoleApply(role, formData);
      clearState();
      router.push(`${ROUTES.UC_APPLY_SUCCESS}?role=${role}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}
      <ApplyStepLayout
        role={role}
        currentStep={1}
        onBack={handleBack}
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        <FormComponent data={formData} onChange={handleFormChange} />
      </ApplyStepLayout>
    </>
  );
}
