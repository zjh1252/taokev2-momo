'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  getInstitutionCompanyInfo,
  submitInstitutionCompanyInfo,
  type InstitutionCompanyInfo,
} from '@/features/user-center/api/role-cert-service';
import { CertProgressBar } from '@/features/user-center/components/cert-progress-bar';
import { CertFileUploader } from '@/features/user-center/components/cert-file-uploader';
import RegionCascader from '@/components/region-cascader';

const COMPANY_NATURE_OPTIONS = ['国企', '民营', '外资', '合资', '事业单位', '其他'];
const COMPANY_SIZE_OPTIONS = ['1-10人', '10-50人', '50-100人', '100-500人', '500-1000人', '1000人以上'];
const PAYMENT_METHOD_OPTIONS = ['对公转账', '支付宝', '微信', '现金', '其他'];

/**
 * 培训机构「公司资料」页 — 单页表单（公司Logo / 公司性质 / 公司网址 / 机构规模 /
 * 年营业额 / 注册资本 / 注册地址 5 段 / 公开课最高佣金比例 / 付款方式 /
 * 是否有版权课 / 银行信息 / 营业执照），底部进度条。
 *
 * @author Fangxinxin
 * @date 2026-04-16 19:30
 */
export default function InstitutionCompanyInfoPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InstitutionCompanyInfo | null>(null);

  const [logoUrl, setLogoUrl] = useState('');
  const [licenseDocUrl, setLicenseDocUrl] = useState('');
  const [licenseNo, setLicenseNo] = useState('');
  const [companyNature, setCompanyNature] = useState('');
  const [website, setWebsite] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [registeredCapital, setRegisteredCapital] = useState('');

  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [townId, setTownId] = useState<number | null>(null);
  const [address, setAddress] = useState('');
  const [postCode, setPostCode] = useState('');

  const [maxCommissionRate, setMaxCommissionRate] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [hasCopyrightCourse, setHasCopyrightCourse] = useState<number>(0);
  const [bankCardNo, setBankCardNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await getInstitutionCompanyInfo();
      const d = resp.data;
      setData(d);
      setLogoUrl(d?.logoUrl || '');
      setLicenseDocUrl(d?.licenseDocUrl || '');
      setLicenseNo(d?.licenseNo || '');
      setCompanyNature(d?.companyNature || '');
      setWebsite(d?.website || '');
      setCompanySize(d?.companySize || '');
      setAnnualRevenue(d?.annualRevenue || '');
      setRegisteredCapital(d?.registeredCapital || '');
      setProvinceId(d?.provinceId || null);
      setCityId(d?.cityId || null);
      setDistrictId(d?.districtId || null);
      setTownId(d?.townId || null);
      setAddress(d?.address || '');
      setPostCode(d?.postCode || '');
      setMaxCommissionRate(
        d?.maxCommissionRate != null ? String(d.maxCommissionRate) : '',
      );
      setPaymentMethods(d?.paymentMethods || []);
      setHasCopyrightCourse(d?.hasCopyrightCourse ?? 0);
      setBankCardNo(d?.bankCardNo || '');
      setBankName(d?.bankName || '');
      setBankBranch(d?.bankBranch || '');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const togglePayment = (method: string) => {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method],
    );
  };

  const handleSubmit = async () => {
    if (!logoUrl) return toast.error('请上传公司 Logo');
    if (!companyNature) return toast.error('请选择公司性质');
    if (!companySize) return toast.error('请选择机构规模');
    if (!annualRevenue.trim()) return toast.error('请填写年营业额');
    if (!registeredCapital.trim()) return toast.error('请填写注册资本');
    if (!provinceId || !cityId || !districtId) return toast.error('请选择注册地址（省/市/区）');
    if (!address.trim()) return toast.error('请填写详细地址');
    const rate = Number(maxCommissionRate);
    if (!maxCommissionRate || Number.isNaN(rate) || rate < 0 || rate > 100) {
      return toast.error('请填写 0-100 之间的最高佣金比例');
    }
    if (!licenseDocUrl) return toast.error('请上传营业执照附件');
    if (licenseNo.trim()) {
      if (!/^\d{15}$|^[A-Z\d]{18}$/.test(licenseNo.trim())) {
        return toast.error('营业执照号需为15位纯数字或18位大写统一社会信用代码');
      }
    }

    setSubmitting(true);
    try {
      await submitInstitutionCompanyInfo({
        logoUrl,
        companyNature,
        website: website.trim(),
        companySize,
        annualRevenue: annualRevenue.trim(),
        registeredCapital: registeredCapital.trim(),
        provinceId,
        cityId,
        districtId,
        townId: townId ?? null,
        address: address.trim(),
        postCode: postCode.trim(),
        maxCommissionRate: rate,
        paymentMethods,
        hasCopyrightCourse,
        bankCardNo: bankCardNo.trim(),
        bankName: bankName.trim(),
        bankBranch: bankBranch.trim(),
        licenseDocUrl,
        licenseNo: licenseNo.trim(),
      });
      toast.success('已提交，等待审核');
      await fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const submittedRegion = useMemo(() => {
    if (!data) return '';
    const ids = [data.provinceId, data.cityId, data.districtId, data.townId]
      .filter((v) => v && v > 0)
      .join(' / ');
    return ids ? `（已保存地区 ID: ${ids}）` : '';
  }, [data]);

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[300px] p-6 text-sm text-slate-400">
        加载中…
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px] p-6 space-y-8">
      <div>
        <div className="text-xl font-bold text-gray-900">公司资料</div>
        <div className="text-sm text-gray-500 mt-2">
          完善机构公司资料以获得平台合作资质。修改并保存后将重新进入审核。
        </div>
      </div>

      {/* ==================== 公司基础 ==================== */}
      <Block title="公司基础信息">
        <div className="space-y-5">
          <div>
            <Label required>公司 Logo</Label>
            <CertFileUploader
              value={logoUrl}
              onChange={setLogoUrl}
              label="公司 Logo"
              accept="image/*"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="公司性质" required>
              <select
                className="form-input"
                value={companyNature}
                onChange={(e) => setCompanyNature(e.target.value)}
              >
                <option value="">请选择</option>
                {COMPANY_NATURE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="机构规模" required>
              <select
                className="form-input"
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
              >
                <option value="">请选择</option>
                {COMPANY_SIZE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="公司网址">
              <input
                className="form-input"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </Field>
            <Field label="年营业额" required>
              <input
                className="form-input"
                value={annualRevenue}
                onChange={(e) => setAnnualRevenue(e.target.value)}
                placeholder="如：500-1000万"
              />
            </Field>
            <Field label="注册资本" required>
              <input
                className="form-input"
                value={registeredCapital}
                onChange={(e) => setRegisteredCapital(e.target.value)}
                placeholder="如：1000万元"
              />
            </Field>
          </div>
        </div>
      </Block>

      {/* ==================== 注册地址 ==================== */}
      <Block title="注册地址">
        <div className="space-y-3">
          <RegionCascader
            maxLevel={4}
            onChange={(region) => {
              setProvinceId(region.provinceId ?? null);
              setCityId(region.cityId ?? null);
              setDistrictId(region.districtId ?? null);
              setTownId(region.townId ?? null);
            }}
          />
          {submittedRegion && (
            <div className="text-xs text-slate-400">{submittedRegion}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Field label="详细地址" required>
                <input
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="街道门牌号等详细地址"
                />
              </Field>
            </div>
            <Field label="邮政编码">
              <input
                className="form-input"
                value={postCode}
                onChange={(e) => setPostCode(e.target.value)}
                placeholder="可选"
              />
            </Field>
          </div>
        </div>
      </Block>

      {/* ==================== 业务信息 ==================== */}
      <Block title="业务信息">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="公开课最高可接受佣金比例（%）" required>
              <input
                className="form-input"
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={maxCommissionRate}
                onChange={(e) => setMaxCommissionRate(e.target.value)}
                placeholder="0 ~ 100"
              />
            </Field>
            <Field label="是否有版权课程">
              <div className="flex items-center gap-4 pt-1">
                {[
                  { v: 1, label: '是' },
                  { v: 0, label: '否' },
                ].map((o) => (
                  <label key={o.v} className="inline-flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="copyright"
                      checked={hasCopyrightCourse === o.v}
                      onChange={() => setHasCopyrightCourse(o.v)}
                    />
                    <span className="text-sm">{o.label}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>
          <div>
            <Label>可接受付款方式</Label>
            <div className="flex flex-wrap gap-3">
              {PAYMENT_METHOD_OPTIONS.map((m) => (
                <label
                  key={m}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 hover:border-primary/60 transition-colors cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={paymentMethods.includes(m)}
                    onChange={() => togglePayment(m)}
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>
        </div>
      </Block>

      {/* ==================== 银行账户 ==================== */}
      <Block title="银行账户信息">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="银行卡号">
            <input
              className="form-input"
              value={bankCardNo}
              onChange={(e) => setBankCardNo(e.target.value)}
              placeholder="对公账户卡号"
            />
          </Field>
          <Field label="开户行">
            <input
              className="form-input"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="例如：中国工商银行"
            />
          </Field>
          <Field label="开户行支行">
            <input
              className="form-input"
              value={bankBranch}
              onChange={(e) => setBankBranch(e.target.value)}
              placeholder="例如：上海浦东分行"
            />
          </Field>
        </div>
      </Block>

      {/* ==================== 证照 ==================== */}
      <Block title="证照信息">
        <div className="space-y-5">
          <Field label="营业执照号">
            <input
              className="form-input"
              value={licenseNo}
              onChange={(e) => setLicenseNo(e.target.value)}
              placeholder="统一社会信用代码 / 注册号"
            />
          </Field>
          <div>
            <Label required>营业执照附件</Label>
            <CertFileUploader
              value={licenseDocUrl}
              onChange={setLicenseDocUrl}
              label="营业执照"
              accept="image/*,.pdf"
            />
          </div>
        </div>
      </Block>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-primary text-white px-6 py-2.5 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors font-bold"
        >
          {submitting ? '保存中…' : data?.status == null ? '提交审核' : '保存并重新审核'}
        </button>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="text-sm text-gray-700 font-bold mb-3">当前进度</div>
        <CertProgressBar
          status={data?.status ?? null}
          submittedAt={data?.submittedAt}
          auditedAt={data?.auditedAt}
          rejectReason={data?.rejectReason}
          label="公司资料"
        />
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          border: 1px solid rgb(203 213 225);
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 14px;
          background: #fff;
        }
      `}</style>
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="text-base font-semibold text-slate-800 border-l-4 border-primary pl-3">
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm block">
      <span className="block text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <div className="text-sm text-gray-600 mb-2">
      {children} {required && <span className="text-red-500">*</span>}
    </div>
  );
}
