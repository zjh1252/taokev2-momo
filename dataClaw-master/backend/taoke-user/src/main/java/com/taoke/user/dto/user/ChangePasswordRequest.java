package com.taoke.user.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 修改密码请求（已登录状态）
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Data
public class ChangePasswordRequest {

    /** 旧密码（如从未设置过密码可为空） */
    private String oldPassword;

    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 32, message = "密码长度为6-32位")
    private String newPassword;
}
