package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 角色 VO（含已分配权限 ID 列表）。
 */
@Data
public class RoleVO {

    private Integer id;
    private String roleCode;
    private String roleName;
    private String description;
    private Integer isSystem;
    private Integer isActive;
    private LocalDateTime createdAt;

    /** 当前角色已关联的权限 ID 列表 */
    private List<Integer> permissionIds;
}
