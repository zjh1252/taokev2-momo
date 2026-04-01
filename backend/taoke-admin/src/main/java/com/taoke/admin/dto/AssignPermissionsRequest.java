package com.taoke.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 给角色分配权限请求（全量替换）。
 */
@Data
public class AssignPermissionsRequest {

    @NotNull(message = "权限 ID 列表不能为 null")
    private List<Integer> permissionIds;
}
