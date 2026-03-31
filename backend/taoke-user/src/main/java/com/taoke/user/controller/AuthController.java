package com.taoke.user.controller;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.user.dto.auth.*;
import com.taoke.user.service.AuthService;
import com.taoke.user.service.VerificationCodeService;
import com.taoke.user.sms.MockSmsProvider;
import com.taoke.user.sms.SmsProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

/**
 * 认证接口：注册、登录、Token 刷新、验证码、重置密码。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Tag(name = "认证", description = "注册/登录/Token 刷新/验证码")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final VerificationCodeService verificationCodeService;
    private final SmsProvider smsProvider;

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

    @Public
    @Operation(summary = "发送验证码")
    @PostMapping("/send-code")
    public ApiResponse<Void> sendCode(@Valid @RequestBody SendCodeRequest request, HttpServletRequest httpRequest) {
        String ip = getClientIp(httpRequest);
        verificationCodeService.sendCode(request.getTarget(), request.getType(), request.getSendType(), ip);
        return ApiResponse.ok(null);
    }

    @Public
    @Operation(summary = "忘记密码-重置密码")
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.ok(null);
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // X-Forwarded-For 可能包含多个 IP，取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /* ======================== Mock 开发调试接口 ======================== */

    /**
     * 仅 dev 环境可用的 Mock 验证码查询接口
     */
    @Profile("dev")
    @RestController
    @RequestMapping("/auth/mock")
    @Tag(name = "Mock-开发调试", description = "仅 dev 环境可用")
    static class MockCodeController {

        private final SmsProvider smsProvider;

        MockCodeController(SmsProvider smsProvider) {
            this.smsProvider = smsProvider;
        }

        @Public
        @Operation(summary = "查询 Mock 验证码（仅 dev 环境）")
        @GetMapping("/code")
        public ApiResponse<String> getMockCode(@RequestParam String phone) {
            if (!(smsProvider instanceof MockSmsProvider mockProvider)) {
                throw new BusinessException(ErrorCode.PARAM_INVALID, "当前非 mock 模式");
            }
            String code = mockProvider.getCode(phone);
            if (code == null) {
                throw new BusinessException(ErrorCode.CAPTCHA_EXPIRED);
            }
            return ApiResponse.ok(code);
        }
    }
}
