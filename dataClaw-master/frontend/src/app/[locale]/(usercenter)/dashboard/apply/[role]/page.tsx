'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ROUTES } from '@/config/routes';
import { ApplyStepLayout } from '@/features/role-apply/components/ApplyStepLayout';
import { useRoleApplyState } from '@/features/role-apply/hooks/useRoleApplyState';
import { submitRoleApply } from '@/features/role-apply/api/service';
import { APPLYABLE_ROLES, type ApplyableRole } from '@/features/role-apply/api/types';
import { useAuth } from '@/lib/auth/auth-context';

/** 无需资质审核、申请即生效的角色 — 提交后直接进入用户中心 */
const AUTO_APPROVE_ROLES: ReadonlySet<ApplyableRole> = new Set<ApplyableRole>([
  'ENTERPRISE_BUYER',
  'ASSISTANT',
]);
import { validateForm, getFirstError, type ValidationError, type FormValidationRules } from '@/lib/validation';
import {
  EnterpriseBuyerForm,
  TrainerApplyForm,
  AgentApplyForm,
  AssistantApplyForm,
  EnterpriseAgentForm,
  InstitutionApplyForm,
  InstitutionEmployeeForm,
  ENTERPRISE_BUYER_RULES,
  TRAINER_RULES,
  AGENT_RULES,
  ASSISTANT_RULES,
  ENTERPRISE_AGENT_RULES,
  INSTITUTION_RULES,
  INSTITUTION_EMPLOYEE_RULES,
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

/** 角色验证规则映射 */
const VALIDATION_RULES_MAP: Record<ApplyableRole, FormValidationRules<unknown>> = {
  ENTERPRISE_BUYER: ENTERPRISE_BUYER_RULES,
  TRAINER: TRAINER_RULES,
  AGENT: AGENT_RULES,
  ASSISTANT: ASSISTANT_RULES,
  ENTERPRISE_AGENT: ENTERPRISE_AGENT_RULES,
  INSTITUTION: INSTITUTION_RULES,
  INSTITUTION_EMPLOYEE: INSTITUTION_EMPLOYEE_RULES,
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
  const { refreshUser, setActiveRole } = useAuth();
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
    const rules = VALIDATION_RULES_MAP[role];
    const validation = validateForm(formData, rules);
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

      // 免审核角色：刷新用户信息、自动切换到新角色，直接进入用户中心
      if (AUTO_APPROVE_ROLES.has(role)) {
        await refreshUser();
        setActiveRole(role);
        toast.success(`恭喜！您已成功获得「${roleMeta?.label || role}」角色`);
        router.push(ROUTES.DASHBOARD);
        return;
      }

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
