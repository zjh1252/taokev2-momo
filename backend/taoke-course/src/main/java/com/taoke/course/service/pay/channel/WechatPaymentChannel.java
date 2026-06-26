package com.taoke.course.service.pay.channel;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.config.PaymentProperties;
import com.taoke.course.dto.pay.PaymentPrepayResult;
import com.taoke.course.entity.order.Order;
import com.taoke.course.entity.pay.Payment;
import com.taoke.course.enums.PaymentClientType;
import com.taoke.course.enums.PaymentMethod;
import com.wechat.pay.java.core.Config;
import com.wechat.pay.java.service.payments.h5.H5Service;
import com.wechat.pay.java.service.payments.h5.model.H5Info;
import com.wechat.pay.java.service.payments.h5.model.PrepayResponse;
import com.wechat.pay.java.service.payments.h5.model.SceneInfo;
import com.wechat.pay.java.service.payments.jsapi.JsapiServiceExtension;
import com.wechat.pay.java.service.payments.jsapi.model.Payer;
import com.wechat.pay.java.service.payments.jsapi.model.PrepayWithRequestPaymentResponse;
import com.wechat.pay.java.service.payments.nativepay.NativePayService;
import com.wechat.pay.java.service.payments.nativepay.model.Amount;
import com.wechat.pay.java.service.payments.nativepay.model.PrepayRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 微信支付：PC Native 扫码、小程序/公众号 JSAPI、H5 MWEB。
 *
 * @author Fangxinxin
 * @date 2026-06-25 14:00
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WechatPaymentChannel implements PaymentChannel {

    private final PaymentProperties paymentProperties;

    @Override
    public PaymentMethod method() {
        return PaymentMethod.WECHAT;
    }

    @Override
    public boolean isConfigured() {
        return paymentProperties.isWechatConfigured();
    }

    @Override
    public PaymentPrepayResult prepay(
            Payment payment,
            Order order,
            String subject,
            PaymentClientType clientType,
            String openId) {
        return switch (clientType) {
            case PC -> prepayNative(payment, subject);
            case MINI_PROGRAM -> prepayJsapi(payment, subject, requireOpenId(openId));
            case H5, APP -> StringUtils.hasText(openId)
                    ? prepayJsapi(payment, subject, openId)
                    : prepayH5(payment, subject);
        };
    }

    private PaymentPrepayResult prepayNative(Payment payment, String subject) {
        try {
            Config config = WechatPayConfigFactory.build(paymentProperties);
            NativePayService service = new NativePayService.Builder().config(config).build();
            PrepayRequest request = buildBasePrepayRequest(payment, subject);

            var response = service.prepay(request);
            if (response == null || !StringUtils.hasText(response.getCodeUrl())) {
                throw new BusinessException(ErrorCode.PAYMENT_PREPAY_FAILED);
            }

            PaymentPrepayResult result = new PaymentPrepayResult();
            result.setQrCodeUrl(response.getCodeUrl());
            return result;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("微信 Native 预下单异常: paymentNo={}", payment.getPaymentNo(), e);
            throw new BusinessException(ErrorCode.PAYMENT_PREPAY_FAILED);
        }
    }

    private PaymentPrepayResult prepayJsapi(Payment payment, String subject, String openId) {
        try {
            Config config = WechatPayConfigFactory.build(paymentProperties);
            JsapiServiceExtension service = new JsapiServiceExtension.Builder().config(config).build();

            com.wechat.pay.java.service.payments.jsapi.model.PrepayRequest request =
                    new com.wechat.pay.java.service.payments.jsapi.model.PrepayRequest();
            request.setAppid(paymentProperties.getWechat().getAppId());
            request.setMchid(paymentProperties.getWechat().getMchId());
            request.setDescription(truncate(subject, 127));
            request.setNotifyUrl(paymentProperties.wechatNotifyUrl());
            request.setOutTradeNo(payment.getPaymentNo());
            request.setAmount(buildJsapiAmount(payment.getAmount()));

            Payer payer = new Payer();
            payer.setOpenid(openId);
            request.setPayer(payer);

            PrepayWithRequestPaymentResponse response = service.prepayWithRequestPayment(request);
            PaymentPrepayResult result = new PaymentPrepayResult();
            Map<String, String> payParams = new LinkedHashMap<>();
            payParams.put("timeStamp", response.getTimeStamp());
            payParams.put("nonceStr", response.getNonceStr());
            payParams.put("package", response.getPackageVal());
            payParams.put("signType", response.getSignType());
            payParams.put("paySign", response.getPaySign());
            result.setPayParams(payParams);
            return result;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("微信 JSAPI 预下单异常: paymentNo={}", payment.getPaymentNo(), e);
            throw new BusinessException(ErrorCode.PAYMENT_PREPAY_FAILED);
        }
    }

    private PaymentPrepayResult prepayH5(Payment payment, String subject) {
        try {
            Config config = WechatPayConfigFactory.build(paymentProperties);
            H5Service service = new H5Service.Builder().config(config).build();

            com.wechat.pay.java.service.payments.h5.model.PrepayRequest request =
                    new com.wechat.pay.java.service.payments.h5.model.PrepayRequest();
            request.setAppid(paymentProperties.getWechat().getAppId());
            request.setMchid(paymentProperties.getWechat().getMchId());
            request.setDescription(truncate(subject, 127));
            request.setNotifyUrl(paymentProperties.wechatNotifyUrl());
            request.setOutTradeNo(payment.getPaymentNo());
            request.setAmount(buildH5Amount(payment.getAmount()));

            SceneInfo sceneInfo = new SceneInfo();
            H5Info h5Info = new H5Info();
            h5Info.setType("Wap");
            sceneInfo.setH5Info(h5Info);
            request.setSceneInfo(sceneInfo);

            PrepayResponse response = service.prepay(request);
            if (response == null || !StringUtils.hasText(response.getH5Url())) {
                throw new BusinessException(ErrorCode.PAYMENT_PREPAY_FAILED);
            }

            PaymentPrepayResult result = new PaymentPrepayResult();
            result.setPayUrl(response.getH5Url());
            return result;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("微信 H5 预下单异常: paymentNo={}", payment.getPaymentNo(), e);
            throw new BusinessException(ErrorCode.PAYMENT_PREPAY_FAILED);
        }
    }

    private PrepayRequest buildBasePrepayRequest(Payment payment, String subject) {
        PrepayRequest request = new PrepayRequest();
        request.setAmount(buildAmount(payment.getAmount()));
        request.setAppid(paymentProperties.getWechat().getAppId());
        request.setMchid(paymentProperties.getWechat().getMchId());
        request.setDescription(truncate(subject, 127));
        request.setNotifyUrl(paymentProperties.wechatNotifyUrl());
        request.setOutTradeNo(payment.getPaymentNo());
        return request;
    }

    private Amount buildAmount(BigDecimal yuan) {
        Amount amount = new Amount();
        amount.setTotal(toFen(yuan));
        amount.setCurrency("CNY");
        return amount;
    }

    private com.wechat.pay.java.service.payments.jsapi.model.Amount buildJsapiAmount(BigDecimal yuan) {
        var amount = new com.wechat.pay.java.service.payments.jsapi.model.Amount();
        amount.setTotal(toFen(yuan));
        amount.setCurrency("CNY");
        return amount;
    }

    private com.wechat.pay.java.service.payments.h5.model.Amount buildH5Amount(BigDecimal yuan) {
        var amount = new com.wechat.pay.java.service.payments.h5.model.Amount();
        amount.setTotal(toFen(yuan));
        amount.setCurrency("CNY");
        return amount;
    }

    private static String requireOpenId(String openId) {
        if (!StringUtils.hasText(openId)) {
            throw new BusinessException(ErrorCode.PAYMENT_OPENID_REQUIRED);
        }
        return openId.trim();
    }

    private static int toFen(BigDecimal yuan) {
        return yuan.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .intValueExact();
    }

    private static String truncate(String value, int maxLen) {
        if (value == null) {
            return "";
        }
        return value.length() <= maxLen ? value : value.substring(0, maxLen);
    }
}
