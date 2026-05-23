package com.taoke.user.captcha;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * 登录失败计数（Redis，按 账号 + IP 维度）。
 * <p>
 * C 端账号密码登录：当失败次数 ≥ 1 时要求滑块验证；登录成功即清零。
 *
 * @author Fangxinxin
 * @date 2026-05-23 15:00
 */
@Component
@RequiredArgsConstructor
public class LoginFailCounter {

    private static final String PREFIX = "login:fail:";
    private static final long TTL_MINUTES = 10;

    private final StringRedisTemplate redisTemplate;

    private String key(String account, String ip) {
        return PREFIX + account + ":" + (ip == null ? "" : ip);
    }

    /** 当前失败次数。 */
    public int count(String account, String ip) {
        String v = redisTemplate.opsForValue().get(key(account, ip));
        if (v == null) {
            return 0;
        }
        try {
            return Integer.parseInt(v);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /** 失败 +1（首次写入设置过期）。 */
    public void increment(String account, String ip) {
        String k = key(account, ip);
        Long c = redisTemplate.opsForValue().increment(k);
        if (c != null && c == 1) {
            redisTemplate.expire(k, TTL_MINUTES, TimeUnit.MINUTES);
        }
    }

    /** 登录成功后清零。 */
    public void reset(String account, String ip) {
        redisTemplate.delete(key(account, ip));
    }
}
