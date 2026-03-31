package com.taoke.user.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.user.dto.*;
import com.taoke.user.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 认证接口：注册、登录、刷新 Token。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Tag(name = "认证", description = "注册/登录/Token 刷新")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Public
    @Operation(summary = "手机号 + 密码登录")
    @PostMapping("/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.ok(authService.loginByPassword(request));
    }

    @Public
    @Operation(summary = "手机号 + 验证码登录（未注册自动注册）")
    @PostMapping("/login/sms")
    public ApiResponse<TokenResponse> loginBySms(@Valid @RequestBody SmsLoginRequest request) {
        return ApiResponse.ok(authService.loginBySms(request));
    }

    @Public
    @Operation(summary = "注册")
    @PostMapping("/register")
    public ApiResponse<TokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @Public
    @Operation(summary = "刷新 Token")
    @PostMapping("/refresh")
    public ApiResponse<TokenResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.ok(authService.refreshToken(request));
    }
}
