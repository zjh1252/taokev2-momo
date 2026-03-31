package com.taoke.user.sms;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.concurrent.TimeUnit;

/**
 * Mock 短信发送实现
 * <p>
 * 不真实发送短信，仅将验证码写入日志和 Redis，方便开发调试。
 * Redis key: {@code taoke:mock:sms:{phone}}，TTL 与验证码有效期一致。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Slf4j
@RequiredArgsConstructor
public class MockSmsProvider implements SmsProvider {

    private static final String MOCK_KEY_PREFIX = "taoke:mock:sms:";

    private final StringRedisTemplate redisTemplate;
    private final SmsProperties smsProperties;

    @Override
    public void send(String phone, String code) {
        log.warn("\n====================================\n"
                + "  [MOCK SMS] 验证码发送\n"
                + "  手机号: {}\n"
                + "  验证码: {}\n"
                + "  有效期: {} 分钟\n"
                + "====================================",
                phone, code, smsProperties.getExpireMinutes());
        redisTemplate.opsForValue().set(
                MOCK_KEY_PREFIX + phone,
                code,
                smsProperties.getExpireMinutes(),
                TimeUnit.MINUTES
        );
    }

    /**
     * 查询 Mock 发送的验证码（仅供 dev 环境调试接口使用）
     */
    public String getCode(String phone) {
        return redisTemplate.opsForValue().get(MOCK_KEY_PREFIX + phone);
    }
}
