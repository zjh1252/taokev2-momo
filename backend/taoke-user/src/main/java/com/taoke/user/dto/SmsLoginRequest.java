package com.taoke.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 手机号 + 验证码登录请求
 */
@Data
public class SmsLoginRequest {

    @NotBlank(message = "手机号不能为空")
    private String phone;

    @NotBlank(message = "验证码不能为空")
    private String code;
}
