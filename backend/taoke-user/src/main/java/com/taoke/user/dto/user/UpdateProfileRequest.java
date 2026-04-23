package com.taoke.user.dto.user;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 修改个人基本资料请求
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Data
public class UpdateProfileRequest {

    @Size(max = 64, message = "昵称不超过64个字符")
    private String nickname;

    /** 真实姓名（写入 sys_users.real_name） */
    @Size(max = 64, message = "真实姓名不超过64个字符")
    private String realName;

    @Size(max = 512, message = "头像URL不超过512个字符")
    private String avatarUrl;

    /** 学习标签（个人学员，逗号分隔关键词） */
    @Size(max = 500, message = "学习标签不超过500个字符")
    private String studyTags;

    /** 性别：0=未知 1=男 2=女 */
    private Integer gender;

    @Size(max = 10, message = "邮编不超过10个字符")
    private String postCode;

    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private Integer townId;

    @Size(max = 200, message = "详细地址不超过200个字符")
    private String address;
}
