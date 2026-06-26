package com.taoke.user.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Token 刷新请求。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Data
public class RefreshTokenRequest {

    @NotBlank(message = "refreshToken 不能为空")
    private String refreshToken;
}
