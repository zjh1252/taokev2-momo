package com.taoke.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 新增/编辑权限请求。
 */
@Data
public class SavePermissionRequest {

    @NotBlank(message = "权限编码不能为空")
    private String permissionCode;

    @NotBlank(message = "权限名称不能为空")
    private String permissionName;

    @NotBlank(message = "所属模块不能为空")
    private String module;

    @NotBlank(message = "操作类型不能为空")
    private String actionType;

    @NotNull(message = "父级 ID 不能为空")
    private Integer parentId;

    private Integer sortOrder;

    private String description;
}
