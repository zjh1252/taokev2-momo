'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import { ROUTES } from '@/config/routes';
import { storage } from '@/lib/storage';
import { TOKEN_KEY } from '@/lib/auth/constants';
import { getMyProfile } from '@/features/user/api/service';
import {
  getOrderDetail,
  getInvoiceRequest,
  submitInvoiceRequest,
} from '@/features/order/api/service';
import type {
  OrderVO,
  InvoiceRequestVO,
  InvoiceType,
  InvoiceTitleType,
} from '@/features/order/api/types';

const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  SPECIAL: '全电发票-增值税专用发票',
  NORMAL: '全电发票-普通发票',
};

const INVOICE_STATUS_LABELS: Record<number, string> = {
  0: '待开票',
  1: '已开票',
  2: '已驳回',
};

function FieldRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <label className="w-36 shrink-0 text-right text-sm text-gray-600 pt-2">
        {required && <span className="text-primary mr-0.5">*</span>}
        {label}：
      </label>
      <div className="flex-1 max-w-md">{children}</div>
    </div>
  );
}

const INPUT_CLS =
  'w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary';

function InvoicePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNo = searchParams.get('orderNo') || '';

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderVO | null>(null);
  const [existing, setExisting] = useState<InvoiceRequestVO | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 表单字段
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('NORMAL');
  const [titleType, setTitleType] = useState<InvoiceTitleType>('PERSONAL');
  const [title, setTitle] = useState('');
  const [taxNo, setTaxNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!orderNo) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const load = async () => {
      try {
        const tokenData = storage.get<{ accessToken?: string }>(TOKEN_KEY);
        const [orderRes, invoiceRes, profileRes] = await Promise.all([
          getOrderDetail(orderNo),
          getInvoiceRequest(orderNo),
          tokenData?.accessToken
            ? getMyProfile(tokenData.accessToken).catch(() => null)
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setOrder(orderRes);
        setExisting(invoiceRes);
        // 默认填写用户在淘课网上留的邮箱，支持修改
        if (profileRes?.data?.email) {
          setEmail(profileRes.data.email);
        }
      } catch {
        // 错误已弹出
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [orderNo]);

  const isCompany = titleType === 'COMPANY';

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('请填写发票抬头');
      return;
    }
    if (isCompany && !taxNo.trim()) {
      toast.error('企业抬头需填写纳税人识别号');
      return;
    }
    if (!email.trim()) {
      toast.error('请填写接收发票的邮箱');
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitInvoiceRequest(orderNo, {
        invoiceType,
        titleType,
        title: title.trim(),
        taxNo: taxNo.trim(),
        bankName: bankName.trim(),
        bankAccount: bankAccount.trim(),
        companyAddress: companyAddress.trim(),
        companyPhone: companyPhone.trim(),
        email: email.trim(),
      });
      setExisting(result);
      toast.success('发票申请已提交');
    } catch {
      // 错误已弹出
    } finally {
      setSubmitting(false);
    }
  };

  if (!orderNo) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-10 text-center text-gray-500">
        缺少订单号参数
      </section>
    );
  }

  if (loading) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-10 flex items-center justify-center text-gray-400">
        <Loader2 className="size-5 animate-spin mr-2" />
        加载中...
      </section>
    );
  }

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
        <Link
          href={ROUTES.UC_ORDERS}
          className="text-gray-500 hover:text-primary flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" />
          返回订单
        </Link>
        <h2 className="text-[15px] font-bold text-gray-800">申请发票</h2>
        <span className="text-xs text-gray-400">订单号：{orderNo}</span>
      </div>

      {/* 提示条 */}
      <div className="mx-6 mt-5 flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 leading-5">
        <Info className="size-4 shrink-0 mt-0.5" />
        电子发票与纸质发票具有同等法律效力，可支持报销入账；同时根据增值税管理办法要求，如需为企业开具增值税发票，需提供纳税人识别号或统一社会信用代码，否则该发票无法作为税收凭证。
      </div>

      {existing ? (
        /* 已申请过 — 展示申请记录 */
        <div className="p-6">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle className="size-5 text-green-600" />
            <span className="font-medium text-gray-800">
              发票申请已提交（{INVOICE_STATUS_LABELS[existing.status] ?? '处理中'}）
            </span>
          </div>
          <div className="space-y-3 text-sm text-gray-600 max-w-lg">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-gray-400">发票类型</span>
              <span>{INVOICE_TYPE_LABELS[existing.invoiceType]}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-gray-400">抬头类型</span>
              <span>{existing.titleType === 'COMPANY' ? '企业' : '个人'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-gray-400">开票金额</span>
              <span className="text-primary font-bold">¥{existing.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-gray-400">发票抬头</span>
              <span>{existing.title}</span>
            </div>
            {existing.titleType === 'COMPANY' && (
              <>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-gray-400">纳税人识别号</span>
                  <span>{existing.taxNo}</span>
                </div>
                {existing.bankName && (
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-gray-400">开户银行</span>
                    <span>{existing.bankName}</span>
                  </div>
                )}
                {existing.bankAccount && (
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-gray-400">银行账号</span>
                    <span>{existing.bankAccount}</span>
                  </div>
                )}
                {existing.companyAddress && (
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-gray-400">企业地址</span>
                    <span>{existing.companyAddress}</span>
                  </div>
                )}
                {existing.companyPhone && (
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-gray-400">企业电话</span>
                    <span>{existing.companyPhone}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-gray-400">接收发票的邮箱</span>
              <span>{existing.email}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push(ROUTES.UC_ORDERS)}
            className="mt-6 px-6 py-2 border border-slate-300 rounded text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
          >
            返回我的订单
          </button>
        </div>
      ) : (
        /* 申请表单 */
        <div className="p-6 flex flex-col gap-5">
          <FieldRow label="发票类型" required>
            <div className="flex flex-wrap gap-5 pt-2">
              {(Object.keys(INVOICE_TYPE_LABELS) as InvoiceType[]).map((t) => (
                <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="invoiceType"
                    checked={invoiceType === t}
                    onChange={() => setInvoiceType(t)}
                    className="accent-primary"
                  />
                  {INVOICE_TYPE_LABELS[t]}
                </label>
              ))}
            </div>
          </FieldRow>

          <FieldRow label="抬头类型" required>
            <div className="flex gap-5 pt-2">
              {(
                [
                  ['PERSONAL', '个人'],
                  ['COMPANY', '企业'],
                ] as [InvoiceTitleType, string][]
              ).map(([t, label]) => (
                <label key={t} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="titleType"
                    checked={titleType === t}
                    onChange={() => setTitleType(t)}
                    className="accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          </FieldRow>

          <FieldRow label="开票金额" required>
            <input
              type="text"
              value={order ? `¥${order.payAmount.toFixed(2)}` : ''}
              readOnly
              disabled
              className={`${INPUT_CLS} bg-slate-50 text-gray-500 cursor-not-allowed`}
            />
            <p className="text-xs text-gray-400 mt-1">默认为该订单实付金额，不可修改</p>
          </FieldRow>

          <FieldRow label="发票抬头" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isCompany ? '请填写企业名称' : '请填写个人姓名'}
              className={INPUT_CLS}
            />
          </FieldRow>

          {isCompany && (
            <>
              <FieldRow label="纳税人识别号" required>
                <input
                  type="text"
                  value={taxNo}
                  onChange={(e) => setTaxNo(e.target.value)}
                  placeholder="请填写纳税人识别号或统一社会信用代码"
                  className={INPUT_CLS}
                />
              </FieldRow>
              <FieldRow label="开户银行">
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="请填写开户银行"
                  className={INPUT_CLS}
                />
              </FieldRow>
              <FieldRow label="银行账号">
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="请填写银行账号"
                  className={INPUT_CLS}
                />
              </FieldRow>
              <FieldRow label="企业地址">
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="请填写企业地址"
                  className={INPUT_CLS}
                />
              </FieldRow>
              <FieldRow label="企业电话">
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="请填写企业电话"
                  className={INPUT_CLS}
                />
              </FieldRow>
            </>
          )}

          <FieldRow label="接收发票的邮箱" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="发票将发送至该邮箱"
              className={INPUT_CLS}
            />
            <p className="text-xs text-gray-400 mt-1">默认为您在淘课网预留的邮箱，可修改</p>
          </FieldRow>

          <div className="flex items-center gap-4 pl-40 mt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2.5 bg-primary text-white font-medium rounded hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
            >
              {submitting ? '提交中...' : '提交申请'}
            </button>
            <Link
              href={ROUTES.UC_ORDERS}
              className="px-8 py-2.5 border border-slate-300 rounded text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors"
            >
              取消
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * 申请发票页 — /dashboard/orders/invoice?orderNo=xxx
 *
 * @author Fangxinxin
 * @date 2026-06-11 14:00
 */
export default function InvoicePage() {
  return (
    <Suspense fallback={null}>
      <InvoicePageInner />
    </Suspense>
  );
}
