'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getPaymentStatus, pay } from '../api/service';
import type { PayResultVO } from '../api/types';

type PaymentMethodOption = 'WECHAT' | 'ALIPAY' | 'MOCK';

interface PaymentModalProps {
  orderNo: string;
  amount: number;
  productTitle?: string;
  onClose: () => void;
  onSuccess: (result: PayResultVO) => void;
}

type PayStep = 'confirm' | 'paying' | 'qrcode' | 'alipay' | 'success';

const POLL_INTERVAL_MS = 2000;
const isDev = process.env.NODE_ENV === 'development';

/**
 * 支付弹窗：PC 端微信扫码 / 支付宝跳转，开发环境可切换 MOCK。
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
  const [pendingPayment, setPendingPayment] = useState<PayResultVO | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const modalTitle = productTitle ? `购买视频：${productTitle}` : '确认支付';

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const handlePaid = useCallback(
    (res: PayResultVO) => {
      stopPolling();
      setResult(res);
      setStep('success');
      setTimeout(() => onSuccess(res), 2000);
    },
    [onSuccess, stopPolling],
  );

  const startPolling = useCallback(
    (paymentNo: string) => {
      stopPolling();
      pollTimerRef.current = setInterval(async () => {
        try {
          const status = await getPaymentStatus(paymentNo);
          if (status.status === 1) {
            handlePaid(status);
          }
        } catch {
          // 轮询失败静默重试
        }
      }, POLL_INTERVAL_MS);
    },
    [handlePaid, stopPolling],
  );

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handlePay = async () => {
    setStep('paying');
    try {
      const res = await pay({
        orderNo,
        method,
        clientType: 'PC',
      });

      if (res.status === 1) {
        handlePaid(res);
        return;
      }

      if (method === 'WECHAT' && res.qrCodeUrl) {
        setPendingPayment(res);
        setStep('qrcode');
        startPolling(res.paymentNo);
        return;
      }

      if (method === 'ALIPAY' && res.payUrl) {
        setPendingPayment(res);
        window.open(res.payUrl, '_blank', 'noopener,noreferrer');
        setStep('alipay');
        startPolling(res.paymentNo);
        return;
      }

      toast.error('未获取到支付参数，请检查后端支付渠道配置');
      setStep('confirm');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '发起支付失败，请稍后重试';
      toast.error(message);
      setStep('confirm');
    }
  };

  const qrImageUrl = pendingPayment?.qrCodeUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pendingPayment.qrCodeUrl)}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl relative">
        {step !== 'paying' && (
          <button
            type="button"
            onClick={() => {
              stopPolling();
              onClose();
            }}
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
                {isDev && (
                  <label
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      method === 'MOCK'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="MOCK"
                      checked={method === 'MOCK'}
                      onChange={() => setMethod('MOCK')}
                      className="sr-only"
                    />
                    <span className="font-medium">模拟支付</span>
                  </label>
                )}
              </div>
              {isDev && method === 'MOCK' ? (
                <p className="text-xs text-amber-600 mt-3 text-center">
                  开发环境模拟支付，点击即完成
                </p>
              ) : (
                <p className="text-xs text-slate-400 mt-3 text-center">
                  微信请扫码支付，支付宝将在新窗口打开
                </p>
              )}
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
            <p className="text-slate-600 font-medium">正在发起支付...</p>
            <p className="text-sm text-slate-400 mt-1">请稍候</p>
          </div>
        )}

        {step === 'qrcode' && pendingPayment && (
          <div className="text-center py-10 px-8">
            <h3 className="text-lg font-bold text-slate-800 mb-2">微信扫码支付</h3>
            <p className="text-sm text-slate-500 mb-6">
              请使用微信扫描下方二维码，支付 ¥{amount.toFixed(2)}
            </p>
            {qrImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrImageUrl}
                alt="微信支付二维码"
                className="mx-auto w-60 h-60 border border-slate-100 rounded-lg"
              />
            ) : null}
            <div className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              等待支付结果...
            </div>
          </div>
        )}

        {step === 'alipay' && pendingPayment && (
          <div className="text-center py-16 px-8">
            <Loader2 className="size-12 text-primary mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">等待支付宝支付</h3>
            <p className="text-sm text-slate-500">
              请在新打开的窗口完成支付，完成后本页将自动更新
            </p>
            {pendingPayment.payUrl && (
              <button
                type="button"
                onClick={() =>
                  window.open(pendingPayment.payUrl!, '_blank', 'noopener,noreferrer')
                }
                className="mt-6 text-sm text-primary hover:underline"
              >
                未打开支付页？点击这里重新打开
              </button>
            )}
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
