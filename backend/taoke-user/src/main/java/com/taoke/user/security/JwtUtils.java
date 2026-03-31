package com.taoke.user.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;
import java.util.UUID;

/**
 * JWT 工具类 — Access Token + Refresh Token 双令牌机制
 */
@Component
public class JwtUtils {

    private final SecretKey secretKey;
    private final long accessTokenExpireMs;
    private final long refreshTokenExpireMs;

    public JwtUtils(
            @Value("${taoke.jwt.secret:taoke-v2-jwt-secret-key-must-be-at-least-256-bits-long!!}") String secret,
            @Value("${taoke.jwt.access-token-expire-ms:7200000}") long accessTokenExpireMs,
            @Value("${taoke.jwt.refresh-token-expire-ms:604800000}") long refreshTokenExpireMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpireMs = accessTokenExpireMs;
        this.refreshTokenExpireMs = refreshTokenExpireMs;
    }

    /**
     * 生成 Access Token
     */
    public String generateAccessToken(Integer userId, Set<String> businessRoles) {
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userId.toString())
                .claim("roles", businessRoles)
                .claim("type", "access")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpireMs))
                .signWith(secretKey)
                .compact();
    }

    /**
     * 生成 Refresh Token
     */
    public String generateRefreshToken(Integer userId) {
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(userId.toString())
                .claim("type", "refresh")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpireMs))
                .signWith(secretKey)
                .compact();
    }

    /**
     * 解析并验证 Token，返回 Claims
     */
    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * 从 Token 中提取用户 ID
     */
    public Integer getUserId(String token) {
        return Integer.parseInt(parseToken(token).getSubject());
    }

    /**
     * 判断是否为 Access Token
     */
    public boolean isAccessToken(String token) {
        return "access".equals(parseToken(token).get("type", String.class));
    }

    /**
     * 判断 Token 是否有效（未过期、签名正确）
     */
    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
