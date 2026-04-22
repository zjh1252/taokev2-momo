'use client';

import { useEffect } from 'react';
import { Info } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import type { AssistantFormData } from '../../api/types';
import { FormField } from './FormField';
import type { FormValidationRules } from '@/lib/validation';
import { Validators } from '@/lib/validation';
import ServiceCitiesEditor from '../ServiceCitiesEditor';
import AgreementCheckbox from '../AgreementCheckbox';

interface AssistantApplyFormProps {
  data: Partial<AssistantFormData>;
  onChange: (data: Partial<AssistantFormData>) => void;
}

/**
 * 专家助理申请表单 — 单段平铺：真实姓名 / 联系电话 / 常用邮箱 / 服务城市 / 合作协议。
 *
 * <p>助理在未绑定专家前不能发布课程等资源，因此顶部追加提示 banner，
 * 提交后由系统自动通过申请。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-22 15:00
 */
export function AssistantApplyForm({ data, onChange }: AssistantApplyFormProps) {
  const { user } = useAuth();
  const update = (patch: Partial<AssistantFormData>) => onChange({ ...data, ...patch });

  useEffect(() => {
    if (!data.contactPhone && user?.phone) {
      onChange({ ...data, contactPhone: user.phone });
    }
  }, [user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <Info className="size-4 mt-0.5 shrink-0" />
        <span>
          专家助理需绑定一位专家后，才能为该专家代发布课程、案例等资源。
          您可在通过申请后前往「我的专家」发起绑定。
        </span>
      </div>

      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          助理信息
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
        </div>
      </fieldset>

      <fieldset>
        <AgreementCheckbox
          id="assistant-agreement"
          title="淘课网注册专家助理合作协议"
          href="/legal/assistant-agreement"
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
 * 专家助理表单验证规则
 */
export const ASSISTANT_RULES: FormValidationRules<AssistantFormData> = {
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
  agreementSigned: {
    required: true,
    requiredMessage: '请先勾选并同意《淘课网注册专家助理合作协议》',
    validator: (value) =>
      value === true ? undefined : '请先勾选并同意《淘课网注册专家助理合作协议》',
  },
};
