'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CategoryTreeNode } from '@/features/trainer/types';
import { dispatchPxbContentResize } from '@/lib/pxb-embed';
import { PxbDateInput } from '@/features/course/components/open/pxb/PxbDateInput';
import {
  buildInternalDemandRequest,
  buildOpenDemandRequest,
  fetchCities,
  fetchProvinces,
  submitPxbDemand,
  usePxbDemandAuth,
  type PxbDemandCourseKind,
  type RegionItem,
} from './pxb-demand-api';
import {
  INTERNAL_TARGET_PLACEHOLDER,
  INTERNAL_TITLE_PLACEHOLDER,
  OPEN_REMARK_PLACEHOLDER,
  OPEN_TITLE_PLACEHOLDER,
  validateContactPhone,
  validateDescription,
  validateEmail,
  validateProposalCount,
  validateRequiredText,
  validateTitle,
} from './pxb-demand-validation';

const OPEN_PATH = '/opencourse/supplier?origin=91pxb';
const INTERNAL_PATH = '/inhousecourse/supplier?origin=91pxb';

interface Props {
  kind: PxbDemandCourseKind;
  expertiseTree: CategoryTreeNode[];
  trainerName?: string;
  trainerId?: number;
}

function flattenL1(tree: CategoryTreeNode[]) {
  return tree.filter((n) => n.level === 1);
}

function minDateStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function PxbDemandFormSection({ kind, expertiseTree, trainerName, trainerId }: Props) {
  const { isLoggedIn, phone } = usePxbDemandAuth();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ demandNo: string; contactName: string } | null>(null);
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [cities, setCities] = useState<RegionItem[]>([]);
  const phonePrefilledRef = useRef(false);

  const [title, setTitle] = useState('');
  const [expertiseCategoryId, setExpertiseCategoryId] = useState<number | ''>('');
  const [expectedStartDate, setExpectedStartDate] = useState('');
  const [provinceId, setProvinceId] = useState<number | ''>('');
  const [cityId, setCityId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [expectedProposalCount, setExpectedProposalCount] = useState('');
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyTel, setCompanyTel] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const expertiseOptions = flattenL1(expertiseTree);
  const isOpen = kind === 'OPEN';

  useEffect(() => {
    fetchProvinces().then(setProvinces).catch(() => {});
  }, []);

  useEffect(() => {
    if (phonePrefilledRef.current || !phone) return;
    phonePrefilledRef.current = true;
    setContactPhone(phone);
  }, [phone]);

  useEffect(() => {
    if (!provinceId) {
      setCities([]);
      return;
    }
    const province = provinces.find((p) => p.id === provinceId);
    if (!province?.code) {
      setCities([]);
      return;
    }
    fetchCities(province.code).then(setCities).catch(() => setCities([]));
  }, [provinceId, provinces]);

  useEffect(() => {
    dispatchPxbContentResize();
  }, [success, submitting]);

  const resetForm = useCallback(() => {
    setTitle('');
    setExpertiseCategoryId('');
    setExpectedStartDate('');
    setProvinceId('');
    setCityId('');
    setDescription('');
    setExpectedProposalCount('');
    setContactName('');
    setCompanyName('');
    setCompanyTel('');
    setContactPhone(phone || '');
    setContactEmail('');
    setSuccess(null);
  }, [phone]);

  const handleTypeChange = (next: PxbDemandCourseKind) => {
    if (next === kind) return;
    window.location.href = next === 'OPEN' ? OPEN_PATH : INTERNAL_PATH;
  };

  const validateForm = (): string | null => {
    const titleErr = validateTitle(title);
    if (titleErr) return titleErr;

    if (isOpen) {
      if (!expertiseCategoryId) return '请选择公开课领域';
      if (!expectedStartDate) return '请选择期望上课时间';
      const descErr = validateDescription(description, '公开课要求');
      if (descErr) return descErr;
    } else {
      if (!provinceId || !cityId) return '请选择培训城市';
      const descErr = validateDescription(description, '培训目标');
      if (descErr) return descErr;
      const propErr = validateProposalCount(expectedProposalCount);
      if (propErr) return propErr;
    }

    if (isOpen && (!provinceId || !cityId)) return '请选择公开课城市';

    const nameErr = validateRequiredText(contactName, '联系人姓名');
    if (nameErr) return nameErr;
    const companyErr = validateRequiredText(companyName, '公司名称');
    if (companyErr) return companyErr;
    const phoneErr = validateContactPhone(contactPhone, companyTel);
    if (phoneErr) return phoneErr;
    const emailErr = validateEmail(contactEmail);
    if (emailErr) return emailErr;

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      window.alert(err);
      return;
    }

    setSubmitting(true);
    try {
      const payload = isOpen
        ? buildOpenDemandRequest({
            title,
            expertiseCategoryId: expertiseCategoryId || undefined,
            expectedStartDate,
            provinceId: provinceId || undefined,
            cityId: cityId || undefined,
            description,
            contactName,
            companyName,
            companyTel,
            contactPhone,
            contactEmail,
          })
        : buildInternalDemandRequest({
            title,
            provinceId: provinceId || undefined,
            cityId: cityId || undefined,
            description,
            expectedProposalCount,
            contactName,
            companyName,
            companyTel,
            contactPhone,
            contactEmail,
            sourceTrainerId: trainerId,
          });

      const result = await submitPxbDemand(payload, {
        isLoggedIn,
        requireCaptcha: isOpen,
      });
      setSuccess({ demandNo: result.demandNo, contactName: contactName.trim() });
    } catch {
      // apiClient / captcha 已处理提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="pxb_content" className="pxb-demand-form">
      <div className="pxb-demand-help">
        <div className="pxb-demand-help-text">
          淘课网有26万门培训课程、2.1万家培训机构、2.2万名讲师。还有专业顾问为你按需匹配，保质保价，让你采购无忧！
          <br />
          <span className="pxb-demand-tip-icon" aria-hidden />
          2分钟发布需求，坐享{' '}
          <a
            className="pxb-demand-advisor"
            href="http://www.taoke.com/act/kefu.htm?arg=taoke&style=1&language=cn&lytype=0"
            target="_blank"
            rel="noopener noreferrer"
          >
            淘课顾问
          </a>{' '}
          为你按需匹配合适的讲师/机构
        </div>
      </div>

      <div className="pxb-demand-subject">
        <span>发布需求</span>
      </div>

      <form className="pxb-demand-register" onSubmit={handleSubmit}>
        <ul className="pxb-demand-fields">
          <li>
            <span className="pxb-demand-lab">
              培训类型：<span className="pxb-demand-req">*</span>
            </span>
            <span className="pxb-demand-content">
              <label className="pxb-demand-radio">
                <input
                  type="radio"
                  name="course_type"
                  checked={!isOpen}
                  onChange={() => handleTypeChange('INTERNAL')}
                />
                内训课
              </label>
              <label className="pxb-demand-radio">
                <input
                  type="radio"
                  name="course_type"
                  checked={isOpen}
                  onChange={() => handleTypeChange('OPEN')}
                />
                公开课
              </label>
            </span>
          </li>

          {!isOpen && trainerName ? (
            <li>
              <span className="pxb-demand-lab">
                指定讲师：<span className="pxb-demand-req">*</span>
              </span>
              <span className="pxb-demand-content">{trainerName}</span>
            </li>
          ) : null}

          <li>
            <span className="pxb-demand-lab">
              {isOpen ? '公开课标题' : '培训标题'}：<span className="pxb-demand-req">*</span>
            </span>
            <span className="pxb-demand-content">
              <input
                type="text"
                className="pxb-demand-input pxb-demand-input-wide"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={isOpen ? OPEN_TITLE_PLACEHOLDER : INTERNAL_TITLE_PLACEHOLDER}
              />
            </span>
          </li>

          {isOpen ? (
            <li>
              <span className="pxb-demand-lab">
                公开课领域：<span className="pxb-demand-req">*</span>
              </span>
              <span className="pxb-demand-content">
                <select
                  className="pxb-demand-select"
                  value={expertiseCategoryId}
                  onChange={(e) =>
                    setExpertiseCategoryId(e.target.value ? Number(e.target.value) : '')
                  }
                >
                  <option value="">请选择分类</option>
                  {expertiseOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </span>
            </li>
          ) : null}

          {isOpen ? (
            <li>
              <span className="pxb-demand-lab">
                期望上课时间：<span className="pxb-demand-req">*</span>
              </span>
              <span className="pxb-demand-content pxb-demand-date-row">
                <PxbDateInput
                  id="course_time"
                  value={expectedStartDate}
                  onChange={setExpectedStartDate}
                  min={minDateStr()}
                />
                <span className="pxb-demand-hint">建议选择距离当前时间一周以上的时间</span>
              </span>
            </li>
          ) : null}

          <li>
            <span className="pxb-demand-lab">
              {isOpen ? '公开课城市' : '培训城市'}：<span className="pxb-demand-req">*</span>
            </span>
            <span className="pxb-demand-content">
              <select
                className="pxb-demand-select pxb-demand-select-short"
                value={provinceId}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : '';
                  setProvinceId(v);
                  setCityId('');
                }}
              >
                <option value="">请选择省份</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <select
                className="pxb-demand-select pxb-demand-select-short"
                value={cityId}
                disabled={!provinceId || cities.length === 0}
                onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">请选择城市</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </span>
          </li>

          <li>
            <span className="pxb-demand-lab">
              {isOpen ? '公开课要求' : '培训目标'}：<span className="pxb-demand-req">*</span>
            </span>
            <span className="pxb-demand-content">
              <textarea
                className="pxb-demand-textarea"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isOpen ? OPEN_REMARK_PLACEHOLDER : INTERNAL_TARGET_PLACEHOLDER}
              />
            </span>
          </li>

          {!isOpen ? (
            <li>
              <span className="pxb-demand-lab">
                期望方案数：<span className="pxb-demand-req">*</span>
              </span>
              <span className="pxb-demand-content">
                <input
                  type="text"
                  className="pxb-demand-input pxb-demand-input-narrow"
                  value={expectedProposalCount}
                  onChange={(e) => setExpectedProposalCount(e.target.value)}
                  placeholder="请输入期望方案数"
                />
              </span>
            </li>
          ) : null}

          <li>
            <span className="pxb-demand-lab">
              联系人姓名：<span className="pxb-demand-req">*</span>
            </span>
            <span className="pxb-demand-content">
              <input
                type="text"
                className="pxb-demand-input pxb-demand-input-wide"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="请填写真实姓名,以便工作人员及时确认"
              />
            </span>
          </li>

          <li>
            <span className="pxb-demand-lab">
              公司名称：<span className="pxb-demand-req">*</span>
            </span>
            <span className="pxb-demand-content">
              <input
                type="text"
                className="pxb-demand-input pxb-demand-input-wide"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="请填写真实公司全名称"
              />
            </span>
          </li>

          <li>
            <span className="pxb-demand-lab">公司电话：</span>
            <span className="pxb-demand-content">
              <input
                type="text"
                className="pxb-demand-input pxb-demand-input-wide"
                value={companyTel}
                onChange={(e) => setCompanyTel(e.target.value)}
                placeholder="请填写公司电话，如：021-34606062"
              />
            </span>
          </li>

          <li>
            <span className="pxb-demand-lab">联系手机：</span>
            <span className="pxb-demand-content">
              <input
                type="text"
                className="pxb-demand-input pxb-demand-input-wide"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="请填写联系人常用手机号码"
              />
            </span>
          </li>

          <li>
            <span className="pxb-demand-lab">
              Email：<span className="pxb-demand-req">*</span>
            </span>
            <span className="pxb-demand-content">
              <input
                type="text"
                className="pxb-demand-input pxb-demand-input-wide"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="请填写常用Email，以便正常接收通知信"
              />
            </span>
          </li>

          <li className="pxb-demand-submit-row">
            <button type="submit" className="pxb-demand-submit" disabled={submitting}>
              {submitting ? '提交中…' : '提交'}
            </button>
          </li>
        </ul>
      </form>

      {success ? (
        <div className="pxb-demand-success-mask" role="dialog" aria-modal="true">
          <div className="pxb-demand-success-box">
            <h3>提交成功</h3>
            <p>
              尊敬的 <strong>{success.contactName}</strong>：
            </p>
            <p>你的需求已提交成功，需求单号：<strong>{success.demandNo}</strong></p>
            <p>感谢你对淘课网的关注和支持</p>
            <div className="pxb-demand-success-actions">
              <button type="button" className="pxb-demand-submit" onClick={resetForm}>
                继续发布需求
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
