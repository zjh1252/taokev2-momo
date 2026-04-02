package com.taoke.admin.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 授权用户业务角色请求（全量替换语义）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 22:00
 */
@Data
public class AssignBusinessRolesRequest {

    /** 业务角色编码列表，空列表表示清空所有业务角色 */
    @NotNull(message = "角色列表不能为 null")
    private List<String> roleCodes;
}
