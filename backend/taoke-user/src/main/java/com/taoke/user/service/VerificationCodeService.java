package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.entity.VerificationCode;
import com.taoke.user.repository.VerificationCodeRepository;
import com.taoke.user.sms.SmsProperties;
import com.taoke.user.sms.SmsProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

/**
 * 验证码服务 — 发送、频率限制、校验
 * <p>
 * 频率限制策略（基于 Redis INCR + EXPIRE）：
 * <ul>
 *   <li>同一手机号/邮箱：60 秒内仅 1 次</li>
 *   <li>同一手机号/邮箱：1 小时内最多 10 次</li>
 *   <li>同一 IP：1 小时内最多 20 次</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationCodeService {

    private static final String RATE_LIMIT_PREFIX = "taoke:sms:limit:";

    private final VerificationCodeRepository verificationCodeRepository;
    private final SmsProvider smsProvider;
    private final SmsProperties smsProperties;
    private final StringRedisTemplate redisTemplate;

    /**
     * 发送验证码
     *
     * @param target   目标（手机号或邮箱）
     * @param type     用途（REGISTER / LOGIN / RESET_PASSWORD / CHANGE_PHONE / CHANGE_EMAIL）
     * @param sendType 渠道（SMS / EMAIL）
     * @param ip       请求 IP（用于频率限制）
     */
    public void sendCode(String target, String type, String sendType, String ip) {
        checkRateLimit(target, ip);

        String code = generateCode();

        // 持久化验证码
        VerificationCode vc = new VerificationCode();
        vc.setTarget(target);
        vc.setCode(code);
        vc.setType(type);
        vc.setSendType(sendType);
        vc.setIsUsed(0);
        vc.setExpiresAt(LocalDateTime.now().plusMinutes(smsProperties.getExpireMinutes()));
        vc.setIp(ip);
        verificationCodeRepository.save(vc);

        // 发送
        if ("SMS".equals(sendType)) {
            smsProvider.send(target, code);
        } else {
            // TODO EMAIL 发送，暂用日志占位
            log.info("[EMAIL] 向 {} 发送验证码: {}", target, code);
        }

        // 更新频率限制计数
        incrementRateLimit(target, ip);
    }

    /**
     * 校验验证码并标记已使用
     *
     * @param target 目标（手机号或邮箱）
     * @param code   用户输入的验证码
     * @param type   用途
     */
    public void verifyCode(String target, String code, String type) {
        VerificationCode vc = verificationCodeRepository
                .findFirstByTargetAndTypeAndIsUsedAndExpiresAtAfterOrderByCreatedAtDesc(
                        target, type, 0, LocalDateTime.now())
                .orElseThrow(() -> new BusinessException(ErrorCode.CAPTCHA_EXPIRED));

        if (!vc.getCode().equals(code)) {
            throw new BusinessException(ErrorCode.CAPTCHA_INCORRECT);
        }

        vc.setIsUsed(1);
        verificationCodeRepository.save(vc);
    }

    private String generateCode() {
        int length = smsProperties.getCodeLength();
        int bound = (int) Math.pow(10, length);
        int code = ThreadLocalRandom.current().nextInt(bound);
        return String.format("%0" + length + "d", code);
    }

    private void checkRateLimit(String target, String ip) {
        // 60 秒间隔
        String minuteKey = RATE_LIMIT_PREFIX + target + ":min";
        if (Boolean.TRUE.equals(redisTemplate.hasKey(minuteKey))) {
            throw new BusinessException(ErrorCode.CAPTCHA_RATE_LIMIT, "请60秒后再试");
        }

        // 同一号码 1 小时上限 10 次
        String hourKey = RATE_LIMIT_PREFIX + target + ":hour";
        String hourCount = redisTemplate.opsForValue().get(hourKey);
        if (hourCount != null && Integer.parseInt(hourCount) >= 10) {
            throw new BusinessException(ErrorCode.CAPTCHA_RATE_LIMIT, "该号码1小时内发送次数已达上限");
        }

        // 同一 IP 1 小时上限 20 次
        if (ip != null) {
            String ipKey = RATE_LIMIT_PREFIX + "ip:" + ip + ":hour";
            String ipCount = redisTemplate.opsForValue().get(ipKey);
            if (ipCount != null && Integer.parseInt(ipCount) >= 20) {
                throw new BusinessException(ErrorCode.CAPTCHA_RATE_LIMIT, "当前网络发送次数已达上限");
            }
        }
    }

    private void incrementRateLimit(String target, String ip) {
        // 60 秒间隔标记
        String minuteKey = RATE_LIMIT_PREFIX + target + ":min";
        redisTemplate.opsForValue().set(minuteKey, "1", 60, TimeUnit.SECONDS);

        // 小时计数
        String hourKey = RATE_LIMIT_PREFIX + target + ":hour";
        Long count = redisTemplate.opsForValue().increment(hourKey);
        if (count != null && count == 1) {
            redisTemplate.expire(hourKey, 1, TimeUnit.HOURS);
        }

        // IP 小时计数
        if (ip != null) {
            String ipKey = RATE_LIMIT_PREFIX + "ip:" + ip + ":hour";
            Long ipCount = redisTemplate.opsForValue().increment(ipKey);
            if (ipCount != null && ipCount == 1) {
                redisTemplate.expire(ipKey, 1, TimeUnit.HOURS);
            }
        }
    }
}
