package com.taoke.admin.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 新增/编辑角色请求。
 */
@Data
public class SaveRoleRequest {

    @NotBlank(message = "角色编码不能为空")
    private String roleCode;

    @NotBlank(message = "角色名称不能为空")
    private String roleName;

    private String description;

    /** 是否启用：1=启用，0=停用，默认启用 */
    private Integer isActive;
}
