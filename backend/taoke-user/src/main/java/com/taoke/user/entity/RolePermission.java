package com.taoke.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 角色-权限关联实体
 */
@Getter
@Setter
@Entity
@Table(name = "sys_role_permissions", uniqueConstraints = {
        @UniqueConstraint(name = "idx_role_permission", columnNames = {"role_id", "permission_id"})
})
@EntityListeners(AuditingEntityListener.class)
public class RolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "role_id", nullable = false)
    private Integer roleId;

    @Column(name = "permission_id", nullable = false)
    private Integer permissionId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
