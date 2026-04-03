'use client';

import type { InstitutionEmployeeFormData } from '../../api/types';

interface InstitutionEmployeeFormProps {
  data: Partial<InstitutionEmployeeFormData>;
  onChange: (data: Partial<InstitutionEmployeeFormData>) => void;
}

/**
 * 机构员工申请表单
 *
 * @author Fangxinxin
 * @date 2026-04-03 16:00
 */
export function InstitutionEmployeeForm({ data, onChange }: InstitutionEmployeeFormProps) {
  const update = (patch: Partial<InstitutionEmployeeFormData>) => onChange({ ...data, ...patch });

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          所属机构
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="所属机构ID" required>
            {/* TODO: 后续改为机构搜索下拉组件 */}
            <input
              type="number"
              min={1}
              value={data.orgId ?? ''}
              onChange={(e) =>
                update({ orgId: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="请输入所属机构的ID（后续支持搜索选择）"
              className="form-input"
            />
          </FormField>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          岗位信息
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <FormField label="部门">
            <input
              type="text"
              value={data.department || ''}
              onChange={(e) => update({ department: e.target.value })}
              placeholder="如：教学部、运营部"
              className="form-input"
            />
          </FormField>
          <FormField label="职位">
            <input
              type="text"
              value={data.position || ''}
              onChange={(e) => update({ position: e.target.value })}
              placeholder="如：课程运营、教务主管"
              className="form-input"
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
