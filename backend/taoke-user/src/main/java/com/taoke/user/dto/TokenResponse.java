package com.taoke.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 认证成功返回的令牌对
 */
@Data
@AllArgsConstructor
public class TokenResponse {

    private String accessToken;
    private String refreshToken;
    private long expiresIn;
}
