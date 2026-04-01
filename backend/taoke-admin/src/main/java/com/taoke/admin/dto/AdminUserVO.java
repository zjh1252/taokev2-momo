package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 后台用户列表视图对象。
 *
 * @author Fangxinxin
 * @date 2026-03-20
 */
@Data
public class AdminUserVO {

    private Integer id;
    private String phone;
    private String nickname;
    private String realName;
    private String avatarUrl;
    private Integer gender;
    private Integer status;
    private String freezeReason;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;

    /** 用户持有的业务角色 */
    private List<RoleItem> roles;

    @Data
    public static class RoleItem {
        private String role;
        private Integer status;
    }
}
