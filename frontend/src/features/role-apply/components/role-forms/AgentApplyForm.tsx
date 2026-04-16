'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { AgentFormData } from '../../api/types';
import { FormField } from './FormField';

interface AgentApplyFormProps {
  data: Partial<AgentFormData>;
  onChange: (data: Partial<AgentFormData>) => void;
}

/**
 * 专家经纪人申请表单
 *
 * @author Fangxinxin
 * @date 2026-04-03 16:00
 */
export function AgentApplyForm({ data, onChange }: AgentApplyFormProps) {
  const { user } = useAuth();
  const update = (patch: Partial<AgentFormData>) => onChange({ ...data, ...patch });

  useEffect(() => {
    if (!data.contactPhone && user?.phone) {
      onChange({ ...data, contactPhone: user.phone });
    }
  }, [user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-slate-100">
          经纪人信息
        </legend>
        <div className="grid grid-cols-1 gap-y-4">
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
          <FormField label="个人简介" required>
            <textarea
              value={data.bio || ''}
              onChange={(e) => update({ bio: e.target.value })}
              placeholder="请介绍您的经纪人从业经历、擅长领域、合作案例等"
              rows={4}
              className="form-input resize-none"
            />
          </FormField>
          <FormField label="擅长方向" required>
            <input
              type="text"
              value={data.specialties || ''}
              onChange={(e) => update({ specialties: e.target.value })}
              placeholder="多个方向用逗号分隔，如：企业管理,领导力,IT培训"
              className="form-input"
            />
          </FormField>
          <FormField label="服务城市">
            {/* TODO: 接入城市多选组件 */}
            <input
              type="text"
              value={data.serviceCityIds || ''}
              onChange={(e) => update({ serviceCityIds: e.target.value })}
              placeholder="多个城市用逗号分隔，如：上海,北京,深圳"
              className="form-input"
            />
          </FormField>
        </div>
      </fieldset>
    </div>
  );
}
