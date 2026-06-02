package com.taoke.user.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taoke.user.sms.MockSmsProvider;
import com.taoke.user.sms.PxbGatewaySmsProvider;
import com.taoke.user.sms.SmsProperties;
import com.taoke.user.sms.SmsProvider;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;

/**
 * 短信发送配置
 * <p>
 * 根据 {@code taoke.sms.provider} 的值创建对应的 {@link SmsProvider} Bean。
 * 支持 mock（默认）、pxb（老站 uc.91pxb.com 网关，真实发送）；aliyun / tencent 待后续接入。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Configuration
@EnableConfigurationProperties(SmsProperties.class)
public class SmsConfig {

    @Bean
    public SmsProvider smsProvider(SmsProperties smsProperties,
                                   StringRedisTemplate redisTemplate,
                                   ObjectMapper objectMapper) {
        String provider = smsProperties.getProvider();
        return switch (provider) {
            case "pxb" -> new PxbGatewaySmsProvider(smsProperties, redisTemplate, objectMapper);
            case "aliyun" ->
                // TODO 接入阿里云短信 SDK
                throw new UnsupportedOperationException("阿里云短信尚未实现，请使用 mock 模式");
            case "tencent" ->
                // TODO 接入腾讯云短信 SDK
                throw new UnsupportedOperationException("腾讯云短信尚未实现，请使用 mock 模式");
            default -> new MockSmsProvider(redisTemplate, smsProperties);
        };
    }
}
