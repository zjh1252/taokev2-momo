package com.taoke.user.dto.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
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

    /** 是否为新注册用户（仅 SMS 登录且为自动注册时返回 true，其余场景不返回） */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean newUser;

    public TokenResponse(String accessToken, String refreshToken, long expiresIn) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.newUser = null;
    }
}
