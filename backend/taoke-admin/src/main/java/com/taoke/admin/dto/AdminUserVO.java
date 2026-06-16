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

    /** 注册来源：1=PC 2=H5 3=小程序 4=运营创建 等 */
    private Integer regOrigin;

    /** 账号来源：1=新站 2=老站迁移 */
    private Integer userSource;

    /** 课程数量（作为 publisher_id） */
    private Integer courseCount;

    /** 案例数量（专家档案关联） */
    private Integer caseCount;

    /** 实名认证状态摘要：NULL=未提交 1=待审核 2=已通过 3=已驳回 */
    private Integer realNameCertStatus;

    @Data
    public static class RoleItem {
        private String role;
        private Integer status;
    }
}
