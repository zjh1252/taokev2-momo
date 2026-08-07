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

/** 结束日期不得早于开始日期 */
export function trainingEndDateRangeValidator(
  startDate: string | undefined,
): (value: unknown) => string | undefined {
  return (value) => {
    const end = String(value ?? '').trim();
    const start = String(startDate ?? '').trim();
    if (start && end && end < start) {
      return '培训结束日期不能早于培训开始日期';
    }
    return undefined;
  };
}

const BASE_CASE_RULES: FormValidationRules<SaveTrainerCaseRequest> = {
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
    required: true,
    requiredMessage: '请选择培训日期',
    validator: Validators.notFutureDate('培训日期不能晚于今天'),
  },
  description: { required: true, requiredMessage: '请填写案例描述' },
  coverImage: { required: true, requiredMessage: '请上传封面图' },
};

/**
 * 案例表单校验规则（含培训结束日期必填与起止关系，依赖当前开始日期）。
 */
export function buildCaseRules(
  form: Pick<Partial<SaveTrainerCaseRequest>, 'trainingDate'>,
): FormValidationRules<SaveTrainerCaseRequest> {
  return {
    ...BASE_CASE_RULES,
    trainingEndDate: {
      required: true,
      requiredMessage: '请选择培训结束日期',
      validator: (value) =>
        trainingEndDateRangeValidator(form.trainingDate)(value) ??
        Validators.notFutureDate('培训结束日期不能晚于今天')(value),
    },
  };
}

/** 与 {@link buildCaseRules} 基础规则相同（不含依赖开始日期的结束日校验） */
export const CASE_RULES = BASE_CASE_RULES;
