package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 用户-RBAC 角色分配实体
 */
@Getter
@Setter
@Entity
@Table(name = "sys_user_role_assignments", uniqueConstraints = {
        @UniqueConstraint(name = "idx_user_role", columnNames = {"user_id", "role_id"})
})
public class UserRoleAssignment extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "role_id", nullable = false)
    private Integer roleId;

    @Column(name = "assigned_by", nullable = false)
    private Integer assignedBy;
}
