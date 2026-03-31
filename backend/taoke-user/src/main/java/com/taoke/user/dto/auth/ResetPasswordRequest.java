package com.taoke.user.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 忘记密码-重置密码请求
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Data
public class ResetPasswordRequest {

    @NotBlank(message = "手机号不能为空")
    private String phone;

    @NotBlank(message = "验证码不能为空")
    private String code;

    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 32, message = "密码长度为6-32位")
    private String newPassword;
}
