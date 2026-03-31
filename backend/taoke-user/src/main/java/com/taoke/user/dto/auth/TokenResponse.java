package com.taoke.user.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 认证成功返回的访问令牌与刷新令牌。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Data
@AllArgsConstructor
public class TokenResponse {

    private String accessToken;
    private String refreshToken;
    private long expiresIn;
}
