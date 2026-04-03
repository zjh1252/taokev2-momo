'use client';

import type { AssistantFormData } from '../../api/types';

interface AssistantApplyFormProps {
  data: Partial<AssistantFormData>;
  onChange: (data: Partial<AssistantFormData>) => void;
}

/**
 * 专家助理申请表单
 *
 * @author Fangxinxin
 * @date 2026-04-03 16:00
 */
export function AssistantApplyForm({ data, onChange }: AssistantApplyFormProps) {
  const update = (patch: Partial<AssistantFormData>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          助理信息
        </legend>
        <div className="grid grid-cols-1 gap-y-4">
          <FormField label="个人简介" required>
            <textarea
              value={data.bio || ''}
              onChange={(e) => update({ bio: e.target.value })}
              placeholder="请简要介绍您的工作经历和助理相关技能"
              rows={4}
              className="form-input resize-none"
            />
          </FormField>
          <FormField label="授权范围说明">
            <textarea
              value={data.authScope || ''}
              onChange={(e) => update({ authScope: e.target.value })}
              placeholder="说明您期望的工作授权范围，如：排期管理、资料维护、学员对接等"
              rows={3}
              className="form-input resize-none"
            />
          </FormField>
        </div>
      </fieldset>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
