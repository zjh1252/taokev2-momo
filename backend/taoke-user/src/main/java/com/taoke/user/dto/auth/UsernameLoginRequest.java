package com.taoke.user.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 账号 + 密码登录请求。
 *
 * @author Fangxinxin
 * @date 2026-04-24 10:00
 */
@Data
public class UsernameLoginRequest {

    @NotBlank(message = "账号不能为空")
    @Pattern(regexp = "^[a-zA-Z0-9_]{4,32}$", message = "账号格式不正确（4-32 位字母/数字/下划线）")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;

    /** 滑块验证通过后的一次性令牌（密码错误 1 次后必填） */
    private String captchaToken;
}
