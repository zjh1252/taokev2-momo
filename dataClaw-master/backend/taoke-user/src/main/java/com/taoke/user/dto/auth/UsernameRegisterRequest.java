package com.taoke.user.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 账号 + 密码注册请求（无手机号、无邮箱）。
 *
 * @author Fangxinxin
 * @date 2026-04-24 10:00
 */
@Data
public class UsernameRegisterRequest {

    @NotBlank(message = "账号不能为空")
    @Pattern(regexp = "^[a-zA-Z0-9_]{4,32}$", message = "账号格式不正确（4-32 位字母/数字/下划线）")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 32, message = "密码长度应为 6-32 位")
    private String password;

    /** 可选；留空时后端用 username 兜底 */
    @Size(max = 20, message = "昵称长度不能超过 20")
    private String nickname;
}
