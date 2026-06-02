package com.taoke.user.captcha;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 验证码二次校验令牌存储（Redis，一次性、短时效）。
 * <p>
 * 滑块校验通过后签发一个 token 返回给前端；后续受保护操作（发短信、登录）携带该 token，
 * 服务端 {@link #consume(String)} 校验并即时删除，确保一次性使用。
 *
 * @author Fangxinxin
 * @date 2026-05-23 15:00
 */
@Component
@RequiredArgsConstructor
public class CaptchaTokenStore {

    private static final String PREFIX = "captcha:pass:";
    private static final long TTL_MINUTES = 2;

    private final StringRedisTemplate redisTemplate;

    /** 签发一次性令牌（TTL 2 分钟）。 */
    public String issue() {
        String token = UUID.randomUUID().toString().replace("-", "");
        redisTemplate.opsForValue().set(PREFIX + token, "1", TTL_MINUTES, TimeUnit.MINUTES);
        return token;
    }

    /** 校验并消费令牌；有效返回 true 并删除，无效返回 false。 */
    public boolean consume(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        return Boolean.TRUE.equals(redisTemplate.delete(PREFIX + token));
    }
}
