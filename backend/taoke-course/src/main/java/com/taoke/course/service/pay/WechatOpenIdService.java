package com.taoke.course.service.pay;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.config.PaymentProperties;
import com.taoke.course.dto.pay.WechatOpenIdVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

/**
 * 微信小程序 code 换 openId。
 *
 * @author Fangxinxin
 * @date 2026-06-25 14:00
 */
@Slf4j
@Service
public class WechatOpenIdService {

    private final PaymentProperties paymentProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public WechatOpenIdService(
            PaymentProperties paymentProperties,
            RestTemplateBuilder restTemplateBuilder,
            ObjectMapper objectMapper) {
        this.paymentProperties = paymentProperties;
        this.restTemplate = restTemplateBuilder.build();
        this.objectMapper = objectMapper;
    }

    public WechatOpenIdVO resolveMiniProgramOpenId(String code) {
        if (!paymentProperties.isWechatMiniProgramConfigured()) {
            throw new BusinessException(ErrorCode.PAYMENT_CHANNEL_NOT_CONFIGURED);
        }

        PaymentProperties.Wechat cfg = paymentProperties.getWechat();
        String url = "https://api.weixin.qq.com/sns/jscode2session"
                + "?appid=" + cfg.getAppId()
                + "&secret=" + cfg.getMiniProgramSecret()
                + "&js_code=" + code
                + "&grant_type=authorization_code";

        try {
            String body = restTemplate.getForObject(url, String.class);
            JsonNode node = objectMapper.readTree(body != null ? body : "{}");
            if (node.hasNonNull("errcode") && node.get("errcode").asInt() != 0) {
                log.warn("微信 jscode2session 失败: {}", body);
                throw new BusinessException(ErrorCode.PAYMENT_PREPAY_FAILED);
            }
            String openId = node.has("openid") ? node.get("openid").asText() : null;
            if (!StringUtils.hasText(openId)) {
                throw new BusinessException(ErrorCode.PAYMENT_PREPAY_FAILED);
            }
            WechatOpenIdVO vo = new WechatOpenIdVO();
            vo.setOpenId(openId);
            return vo;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("微信 jscode2session 异常", e);
            throw new BusinessException(ErrorCode.PAYMENT_PREPAY_FAILED);
        }
    }
}
