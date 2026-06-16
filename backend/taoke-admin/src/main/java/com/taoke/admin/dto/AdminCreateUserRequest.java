package com.taoke.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 后台运营创建用户请求。
 *
 * @author Fangxinxin
 * @date 2026-06-12 14:00
 */
@Data
public class AdminCreateUserRequest {

    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1\\d{10}$", message = "请输入正确的手机号")
    private String phone;

    @NotBlank(message = "昵称不能为空")
    private String nickname;

    private String realName;
}
