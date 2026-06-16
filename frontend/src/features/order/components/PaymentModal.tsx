'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, X } from 'lucide-react';
import { pay } from '../api/service';
import type { PayResultVO } from '../api/types';

type PaymentMethodOption = 'WECHAT' | 'ALIPAY';

interface PaymentModalProps {
  orderNo: string;
  amount: number;
  productTitle?: string;
  onClose: () => void;
  onSuccess: (result: PayResultVO) => void;
}

type PayStep = 'confirm' | 'paying' | 'success';

/**
 * 支付弹窗（模拟支付）
 *
 * 展示订单信息、支付方式选择，确认后调用模拟支付接口。
 */
export function PaymentModal({
  orderNo,
  amount,
  productTitle,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<PayStep>('confirm');
  const [result, setResult] = useState<PayResultVO | null>(null);
  const [method, setMethod] = useState<PaymentMethodOption>('WECHAT');

  const modalTitle = productTitle ? `购买视频：${productTitle}` : '确认支付';

  const handlePay = async () => {
    setStep('paying');
    try {
      // 当前为模拟支付，无论选择哪种方式均走 MOCK 完成支付
      const res = await pay({ orderNo, method: 'MOCK' });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setResult(res);
      setStep('success');
      setTimeout(() => onSuccess(res), 2000);
    } catch {
      setStep('confirm');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl relative">
        {step !== 'paying' && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
          >
            <X className="size-5" />
          </button>
        )}

        {step === 'confirm' && (
          <div className="p-8">
            <h3 className="text-xl font-bold text-slate-800 text-center mb-6 pr-8">
              {modalTitle}
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">订单编号</span>
                <span className="text-slate-800 font-medium">{orderNo}</span>
              </div>
              {productTitle && (
                <div className="flex justify-between items-start gap-4 text-sm">
                  <span className="text-slate-500 flex-shrink-0">视频标题</span>
                  <span className="text-slate-800 font-medium text-right line-clamp-2">
                    {productTitle}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-slate-600">应付金额</span>
                <span className="text-3xl font-bold text-primary">
                  ¥{amount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-slate-700 mb-3">支付方式</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <label
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    method === 'WECHAT'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="WECHAT"
                    checked={method === 'WECHAT'}
                    onChange={() => setMethod('WECHAT')}
                    className="sr-only"
                  />
                  <span className="font-medium">微信支付</span>
                </label>
                <label
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    method === 'ALIPAY'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ALIPAY"
                    checked={method === 'ALIPAY'}
                    onChange={() => setMethod('ALIPAY')}
                    className="sr-only"
                  />
                  <span className="font-medium">支付宝支付</span>
                </label>
              </div>
              <p className="text-xs text-slate-400 mt-3 text-center">
                当前为模拟支付模式，点击即完成支付
              </p>
            </div>

            <button
              type="button"
              onClick={handlePay}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-lg hover:bg-primary/90 transition-colors text-base"
            >
              确认支付
            </button>
          </div>
        )}

        {step === 'paying' && (
          <div className="text-center py-16 px-8">
            <Loader2 className="size-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-slate-600 font-medium">支付处理中...</p>
            <p className="text-sm text-slate-400 mt-1">请稍候</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-16 px-8">
            <CheckCircle className="size-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-800 mb-2">支付成功</h3>
            <p className="text-sm text-slate-500">
              支付金额：¥{result?.amount.toFixed(2)}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              即将跳转到我的订单，您可前往观看录播课
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
