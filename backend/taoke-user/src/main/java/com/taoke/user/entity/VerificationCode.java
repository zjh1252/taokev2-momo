package com.taoke.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 短信/邮件验证码实体
 */
@Getter
@Setter
@Entity
@Table(name = "sys_verification_codes")
@EntityListeners(AuditingEntityListener.class)
public class VerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "target", nullable = false, length = 128)
    private String target;

    @Column(name = "code", nullable = false, length = 10)
    private String code;

    @Column(name = "type", nullable = false, length = 32)
    private String type;

    /** 发送渠道：SMS / EMAIL */
    @Column(name = "send_type", nullable = false, length = 10)
    private String sendType;

    @Column(name = "is_used", nullable = false, columnDefinition = "tinyint")
    private Integer isUsed = 0;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "ip", length = 45)
    private String ip;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
