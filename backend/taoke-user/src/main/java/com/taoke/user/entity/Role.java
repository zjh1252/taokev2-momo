package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * RBAC 角色定义实体 — Layer 2: 权限授权层
 */
@Getter
@Setter
@Entity
@Table(name = "sys_roles")
public class Role extends BaseEntity {

    @Column(name = "role_code", nullable = false, unique = true, length = 64)
    private String roleCode;

    @Column(name = "role_name", nullable = false, length = 64)
    private String roleName;

    @Column(name = "description", length = 255)
    private String description;

    /** 是否系统内置：1=是（不可删除），0=否 */
    @Column(name = "is_system", nullable = false)
    private Integer isSystem = 0;

    /** 是否启用：1=启用，0=停用 */
    @Column(name = "is_active", nullable = false)
    private Integer isActive = 1;
}
