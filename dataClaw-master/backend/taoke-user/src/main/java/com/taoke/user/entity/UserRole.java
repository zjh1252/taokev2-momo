package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 用户业务角色实体（业务身份层）。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Getter
@Setter
@Entity
@Table(name = "sys_user_roles", uniqueConstraints = {
        @UniqueConstraint(name = "idx_user_role", columnNames = {"user_id", "role"})
})
public class UserRole extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "role", nullable = false, length = 32)
    private String role;

    /** 角色状态：1=生效，2=待审核，3=审核驳回，4=已禁用 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 1;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by")
    private Integer approvedBy;

    /** 驳回原因 */
    @Column(name = "reject_reason", length = 512)
    private String rejectReason;
}
