'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, X } from 'lucide-react';
import { pay } from '../api/service';
import type { PayResultVO } from '../api/types';

interface PaymentModalProps {
  orderNo: string;
  amount: number;
  onClose: () => void;
  onSuccess: (result: PayResultVO) => void;
}

type PayStep = 'confirm' | 'paying' | 'success';

/**
 * 支付弹窗（模拟支付）
 *
 * 点击确认后调用模拟支付接口，显示支付过程动画。
 */
export function PaymentModal({
  orderNo,
  amount,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<PayStep>('confirm');
  const [result, setResult] = useState<PayResultVO | null>(null);

  const handlePay = async () => {
    setStep('paying');
    try {
      const res = await pay({ orderNo, method: 'MOCK' });
      // 模拟短暂支付过程
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setResult(res);
      setStep('success');
      setTimeout(() => onSuccess(res), 1200);
    } catch {
      setStep('confirm');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        {step !== 'paying' && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        )}

        {step === 'confirm' && (
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-2">确认支付</h3>
            <p className="text-sm text-slate-500 mb-4">
              订单编号：{orderNo}
            </p>
            <div className="text-3xl font-bold text-primary mb-6">
              ¥{amount.toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 mb-4">
              当前为模拟支付模式，点击即完成支付
            </div>
            <button
              type="button"
              onClick={handlePay}
              className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              确认支付
            </button>
          </div>
        )}

        {step === 'paying' && (
          <div className="text-center py-8">
            <Loader2 className="size-12 text-primary mx-auto mb-4 animate-spin" />
            <p className="text-slate-600 font-medium">支付处理中...</p>
            <p className="text-sm text-slate-400 mt-1">请稍候</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="size-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              支付成功
            </h3>
            <p className="text-sm text-slate-500">
              支付金额：¥{result?.amount.toFixed(2)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              即将跳转到订单详情...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
