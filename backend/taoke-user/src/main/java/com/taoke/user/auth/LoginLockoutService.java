package com.taoke.user.auth;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 密码登录失败锁定：按账号维度统计连续密码错误，达阈值后锁定指定时长。
 *
 * @author Fangxinxin
 * @date 2026-06-22 10:00
 */
@Service
@RequiredArgsConstructor
public class LoginLockoutService {

    private static final String FAIL_PREFIX = "login:pwd-fail:";
    private static final String LOCK_PREFIX = "login:lock:";

    private final StringRedisTemplate redisTemplate;
    private final LoginLockoutProperties properties;

    /** 登录前校验：账号处于锁定期则拒绝密码登录。 */
    public void checkNotLocked(String account) {
        if (!properties.isEnabled()) {
            return;
        }
        long remainingSeconds = getLockRemainingSeconds(account);
        if (remainingSeconds > 0) {
            throw new BusinessException(ErrorCode.ACCOUNT_LOGIN_LOCKED, buildLockMessage(remainingSeconds));
        }
    }

    /**
     * 记录一次密码错误；达阈值时写入锁定并抛出锁定异常。
     * 登录成功时应调用 {@link #clear(String)}。
     */
    public void recordPasswordFailure(String account) {
        if (!properties.isEnabled()) {
            return;
        }
        String normalized = normalize(account);
        String failKey = FAIL_PREFIX + normalized;
        Long count = redisTemplate.opsForValue().increment(failKey);
        if (count != null && count == 1) {
            redisTemplate.expire(failKey, properties.getLockDurationMinutes(), TimeUnit.MINUTES);
        }
        if (count != null && count >= properties.getMaxFailures()) {
            String lockKey = LOCK_PREFIX + normalized;
            redisTemplate.opsForValue().set(
                    lockKey,
                    "1",
                    properties.getLockDurationMinutes(),
                    TimeUnit.MINUTES
            );
            redisTemplate.delete(failKey);
            throw new BusinessException(
                    ErrorCode.ACCOUNT_LOGIN_LOCKED,
                    buildLockMessage(properties.getLockDurationMinutes() * 60L)
            );
        }
    }

    /** 登录成功后清零失败计数与锁定状态。 */
    public void clear(String account) {
        if (!properties.isEnabled()) {
            return;
        }
        String normalized = normalize(account);
        redisTemplate.delete(FAIL_PREFIX + normalized);
        redisTemplate.delete(LOCK_PREFIX + normalized);
    }

    private long getLockRemainingSeconds(String account) {
        String lockKey = LOCK_PREFIX + normalize(account);
        Long ttl = redisTemplate.getExpire(lockKey, TimeUnit.SECONDS);
        if (ttl == null || ttl <= 0) {
            return 0;
        }
        return ttl;
    }

    private static String normalize(String account) {
        return account == null ? "" : account.trim();
    }

    private static String buildLockMessage(long remainingSeconds) {
        int minutes = (int) Math.max(1, Math.ceil(remainingSeconds / 60.0));
        return "密码错误次数过多，账号已锁定，请" + minutes + "分钟后再试";
    }
}
