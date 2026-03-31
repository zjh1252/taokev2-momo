package com.taoke.user.repository;

import com.taoke.user.entity.VerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Integer> {

    /**
     * 查询目标 + 类型下最近一条未使用且未过期的验证码
     */
    Optional<VerificationCode> findFirstByTargetAndTypeAndIsUsedAndExpiresAtAfterOrderByCreatedAtDesc(
            String target, String type, Integer isUsed, LocalDateTime now);

    /**
     * 统计指定时间范围内同一目标 + 类型的发送次数（频率限制用）
     */
    long countByTargetAndTypeAndCreatedAtAfter(String target, String type, LocalDateTime after);

    /**
     * 统计指定时间范围内同一 IP 的发送次数
     */
    long countByIpAndCreatedAtAfter(String ip, LocalDateTime after);
}
