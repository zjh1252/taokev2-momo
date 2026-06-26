package com.taoke.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 角色申请资料变更日志 — 记录已生效用户每次"资料重审"时的字段级变更。
 *
 * @author Fangxinxin
 * @date 2026-06-25 18:00
 */
@Getter
@Setter
@Entity
@Table(name = "role_application_change_logs")
public class RoleApplicationChangeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "role", nullable = false, length = 32)
    private String role;

    /** 变更批次号，同一次提交共享（格式：{role}-{userId}-{timestamp}） */
    @Column(name = "change_batch", nullable = false, length = 64)
    private String changeBatch;

    @Column(name = "field_name", nullable = false, length = 64)
    private String fieldName;

    @Column(name = "field_label", nullable = false, length = 64)
    private String fieldLabel;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
