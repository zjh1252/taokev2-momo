package com.taoke.user.dto.user;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 当前用户个人信息返回
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Data
public class UserProfileResponse {

    private Integer id;
    private String phone;
    private String email;
    private String nickname;
    private String realName;
    private String avatarUrl;
    /** 学习标签（个人学员，逗号分隔关键词） */
    private String studyTags;
    private Integer gender;
    private String postCode;
    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private Integer townId;
    private String address;
    private Integer status;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;

    /** 是否已设置密码 */
    private Boolean hasPassword;

    /** 是否老站迁移账号 */
    private Boolean oldUser;

    /** 用户持有的业务角色列表 */
    private List<RoleInfo> roles;

    @Data
    public static class RoleInfo {
        private String role;
        private Integer status;
        /** 是否「已生效身份资料重审中」（status=1 且重新提交了角色资料） */
        private Boolean reapplying;
        private LocalDateTime approvedAt;
    }
}
