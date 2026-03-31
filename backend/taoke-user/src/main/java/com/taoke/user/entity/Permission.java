package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 权限节点实体 — 树形结构，按"功能模块 + 操作类型"定义
 */
@Getter
@Setter
@Entity
@Table(name = "sys_permissions")
public class Permission extends BaseEntity {

    @Column(name = "permission_code", nullable = false, unique = true, length = 128)
    private String permissionCode;

    @Column(name = "permission_name", nullable = false, length = 64)
    private String permissionName;

    @Column(name = "module", nullable = false, length = 64)
    private String module;

    @Column(name = "action_type", nullable = false, length = 20)
    private String actionType;

    @Column(name = "parent_id", nullable = false)
    private Integer parentId = 0;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "description", length = 255)
    private String description;
}
