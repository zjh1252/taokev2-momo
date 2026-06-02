package com.taoke.user.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 手机号与密码登录请求。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Data
public class LoginRequest {

    @NotBlank(message = "手机号不能为空")
    private String phone;

    @NotBlank(message = "密码不能为空")
    private String password;

    /** 滑块验证通过后的一次性令牌（后台登录始终必填） */
    private String captchaToken;
}
