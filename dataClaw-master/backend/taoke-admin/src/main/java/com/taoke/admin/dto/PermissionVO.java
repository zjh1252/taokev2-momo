package com.taoke.admin.dto;

import lombok.Data;

import java.util.List;

/**
 * 权限节点 VO（支持树形结构）。
 */
@Data
public class PermissionVO {

    private Integer id;
    private String permissionCode;
    private String permissionName;
    private String module;
    private String actionType;
    private Integer parentId;
    private Integer sortOrder;
    private String description;

    /** 子节点（树形展示时填充） */
    private List<PermissionVO> children;
}
