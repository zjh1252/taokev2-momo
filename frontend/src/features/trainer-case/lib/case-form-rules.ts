import type { SaveTrainerCaseRequest } from '../api/types';
import { Validators, type FormValidationRules } from '@/lib/validation';

const positiveIdValidator = (msg: string) => (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? undefined : msg;
};

/** 受训人数：未填跳过；填写时需为 >=1 的整数 */
export function traineeCountValidator(v: unknown): string | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 ? undefined : '受训人数需为大于等于 1 的整数';
}

export const CASE_RULES: FormValidationRules<SaveTrainerCaseRequest> = {
  caseTitle: { required: true, requiredMessage: '请输入案例标题' },
  enterpriseName: { required: true, requiredMessage: '请输入企业名称' },
  provinceId: {
    required: true,
    requiredMessage: '请选择培训地点（省份）',
    validator: positiveIdValidator('请选择培训地点（省份）'),
  },
  cityId: {
    required: true,
    requiredMessage: '请选择培训地点（城市）',
    validator: positiveIdValidator('请选择培训地点（城市）'),
  },
  districtId: {
    required: true,
    requiredMessage: '请选择培训地点（区/县）',
    validator: positiveIdValidator('请选择培训地点（区/县）'),
  },
  traineeCount: {
    validator: traineeCountValidator,
  },
  trainingDate: {
    validator: Validators.notFutureDate('培训日期不能晚于今天'),
  },
  description: { required: true, requiredMessage: '请填写案例描述' },
  coverImage: { required: true, requiredMessage: '请上传封面图' },
};
