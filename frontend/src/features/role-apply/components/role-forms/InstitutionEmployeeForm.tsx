'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { InstitutionEmployeeFormData } from '../../api/types';
import { FormField } from './FormField';
import type { FormValidationRules } from '@/lib/validation';
import { Validators } from '@/lib/validation';
import ServiceCitiesEditor from '../ServiceCitiesEditor';
import AgreementCheckbox from '../AgreementCheckbox';
import InstitutionPicker from '../InstitutionPicker';
import { useProfilePrefill } from '../../hooks/useProfilePrefill';
import { getMyInstitutionEmployeeProfileAsForm } from '../../api/service';

interface InstitutionEmployeeFormProps {
  data: Partial<InstitutionEmployeeFormData>;
  onChange: (data: Partial<InstitutionEmployeeFormData>) => void;
}

/**
 * 机构员工申请表单 — 重构后单段平铺：真实姓名 / 联系电话 / 常用邮箱 /
 * 服务城市 / 所属机构（带未匹配 CTA）/ 合作协议。
 *
 * <p>提交后由所选机构在用户中心审核确认；如未检索到目标机构，
 * 用户可点击「去申请培训机构」直接进入机构角色申请流程。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 17:30
 */
export function InstitutionEmployeeForm({ data, onChange }: InstitutionEmployeeFormProps) {
  const { user } = useAuth();
  const update = (patch: Partial<InstitutionEmployeeFormData>) => onChange({ ...data, ...patch });

  // 已生效（status=1）的机构员工进入「修改资料」流程时自动回填档案
  useProfilePrefill<InstitutionEmployeeFormData>({
    role: 'INSTITUTION_EMPLOYEE',
    data,
    onChange,
    fetcher: getMyInstitutionEmployeeProfileAsForm,
    isEmpty: (d) => !d.realName && !d.email,
  });

  useEffect(() => {
    if (!data.contactPhone && user?.phone) {
      onChange({ ...data, contactPhone: user.phone });
    }
  }, [user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          员工信息
        </legend>
        <div className="grid grid-cols-1 gap-y-4">
          <FormField label="真实姓名" required>
            <input
              type="text"
              value={data.realName || ''}
              onChange={(e) => update({ realName: e.target.value })}
              placeholder="请输入您的真实姓名"
              maxLength={64}
              className="form-input"
            />
          </FormField>

          <FormField label="联系电话" required>
            <input
              type="tel"
              value={data.contactPhone || ''}
              onChange={(e) => update({ contactPhone: e.target.value })}
              placeholder="11位手机号"
              maxLength={11}
              className="form-input"
            />
          </FormField>

          <FormField label="常用邮箱" required>
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="example@domain.com"
              maxLength={128}
              className="form-input"
            />
          </FormField>

          <FormField label="服务城市">
            <ServiceCitiesEditor
              value={data.serviceCities || []}
              onChange={(value) => update({ serviceCities: value })}
            />
          </FormField>

          <FormField label="所属机构" required>
            <InstitutionPicker
              value={data.orgId ?? null}
              onPick={(item) => update({ orgId: item?.id ?? null })}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              提交后将由所选机构在用户中心审核您的申请，平台不再做二次审核。
            </p>
          </FormField>
        </div>
      </fieldset>

      <fieldset>
        <AgreementCheckbox
          id="institution-employee-agreement"
          title="淘课网注册培训机构员工合作协议"
          href="/legal/institution-employee-agreement"
          checked={!!data.agreementSigned}
          version={data.agreementVersion || 'v1'}
          onChange={(checked, version) =>
            update({ agreementSigned: checked, agreementVersion: version })
          }
        />
      </fieldset>
    </div>
  );
}

/**
 * 机构员工表单验证规则
 */
export const INSTITUTION_EMPLOYEE_RULES: FormValidationRules<InstitutionEmployeeFormData> = {
  realName: { required: true, requiredMessage: '请输入真实姓名' },
  contactPhone: {
    required: true,
    requiredMessage: '请输入联系电话',
    validator: Validators.phone,
  },
  email: {
    required: true,
    requiredMessage: '请输入常用邮箱',
    validator: Validators.email,
  },
  orgId: { required: true, requiredMessage: '请选择要加入的机构' },
  agreementSigned: {
    required: true,
    requiredMessage: '请先勾选并同意《淘课网注册培训机构员工合作协议》',
    validator: (value) =>
      value === true ? undefined : '请先勾选并同意《淘课网注册培训机构员工合作协议》',
  },
};
