package com.taoke.user.controller;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.user.captcha.CaptchaProperties;
import com.taoke.user.captcha.CaptchaTokenStore;
import com.taoke.user.captcha.LoginFailCounter;
import com.taoke.user.dto.auth.*;
import com.taoke.user.api.AuthService;
import com.taoke.user.api.VerificationCodeService;
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
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final VerificationCodeService verificationCodeService;
    private final SmsProvider smsProvider;
    private final CaptchaTokenStore captchaTokenStore;
    private final LoginFailCounter loginFailCounter;
    private final CaptchaProperties captchaProperties;

    /**
     * 手机号 + 密码登录（后台管理登录走此接口）。后台登录始终要求滑块验证。
     */
    @Public
    @Operation(summary = "手机号 + 密码登录（后台，始终需滑块）")
    @PostMapping("/auth/login")
    public ApiResponse<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        // 后台登录：始终强制滑块验证
        if (captchaProperties.isEnabled() && !captchaTokenStore.consume(request.getCaptchaToken())) {
            throw new BusinessException(ErrorCode.CAPTCHA_REQUIRED);
        }
        return ApiResponse.ok(authService.loginByPassword(request));
    }

    @Public
    @Operation(summary = "手机号 + 验证码登录（未注册自动注册）")
    @PostMapping("/auth/login/sms")
    public ApiResponse<TokenResponse> loginBySms(@Valid @RequestBody SmsLoginRequest request) {
        return ApiResponse.ok(authService.loginBySms(request));
    }

    @Public
    @Operation(summary = "注册")
    @PostMapping("/auth/register")
    public ApiResponse<TokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    /**
     * 账号 + 密码登录（C 端）。密码错误 1 次后要求滑块验证；登录成功清零失败计数。
     */
    @Public
    @Operation(summary = "账号 + 密码登录（C 端，错 1 次后需滑块）")
    @PostMapping("/auth/login/username")
    public ApiResponse<TokenResponse> loginByUsername(@Valid @RequestBody UsernameLoginRequest request,
                                                      HttpServletRequest httpRequest) {
        String ip = getClientIp(httpRequest);
        String account = request.getUsername();
        boolean captchaOn = captchaProperties.isEnabled();

        // 已有失败记录（达阈值）→ 必须先过滑块
        if (captchaOn
                && loginFailCounter.count(account, ip) >= captchaProperties.getLoginFailThreshold()
                && !captchaTokenStore.consume(request.getCaptchaToken())) {
            throw new BusinessException(ErrorCode.CAPTCHA_REQUIRED);
        }

        try {
            TokenResponse token = authService.loginByUsername(request);
            if (captchaOn) {
                loginFailCounter.reset(account, ip);
            }
            return ApiResponse.ok(token);
        } catch (BusinessException e) {
            // 密码错误累加失败次数，前端据 CAPTCHA_REQUIRED / 本次失败后展示滑块
            if (captchaOn && e.getErrorCode() == ErrorCode.PASSWORD_INCORRECT) {
                loginFailCounter.increment(account, ip);
            }
            throw e;
        }
    }

    @Public
    @Operation(summary = "账号 + 密码注册")
    @PostMapping("/auth/register/username")
    public ApiResponse<TokenResponse> registerByUsername(@Valid @RequestBody UsernameRegisterRequest request) {
        return ApiResponse.ok(authService.registerByUsername(request));
    }

    @Public
    @Operation(summary = "账号可用性预检")
    @GetMapping("/auth/username/available")
    public ApiResponse<Boolean> isUsernameAvailable(@RequestParam String username) {
        return ApiResponse.ok(authService.isUsernameAvailable(username));
    }

    @Public
    @Operation(summary = "刷新 Token")
    @PostMapping("/auth/refresh")
    public ApiResponse<TokenResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.ok(authService.refreshToken(request));
    }

    @Public
    @Operation(summary = "发送验证码（C 端，发码前需滑块）")
    @PostMapping("/auth/send-code")
    public ApiResponse<Void> sendCode(@Valid @RequestBody SendCodeRequest request, HttpServletRequest httpRequest) {
        // C 端发短信前始终强制滑块验证（防刷 + 保护短信网关）
        if (captchaProperties.isEnabled() && !captchaTokenStore.consume(request.getCaptchaToken())) {
            throw new BusinessException(ErrorCode.CAPTCHA_REQUIRED);
        }
        String ip = getClientIp(httpRequest);
        verificationCodeService.sendCode(request.getTarget(), request.getType(), request.getSendType(), ip);
        return ApiResponse.ok(null);
    }

    @Public
    @Operation(summary = "忘记密码-重置密码")
    @PostMapping("/auth/reset-password")
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
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /* ======================== Mock 开发调试接口 ======================== */

    /**
     * 仅 dev 环境可用的 Mock 验证码查询接口
     */
    @Profile({"dev", "test"})
    @RestController
    @Tag(name = "Mock-开发调试", description = "仅 dev/test 环境可用")
    static class MockCodeController {

        private final SmsProvider smsProvider;

        MockCodeController(SmsProvider smsProvider) {
            this.smsProvider = smsProvider;
        }

        @Public
        @Operation(summary = "查询 Mock 验证码（仅 dev 环境）")
        @GetMapping("/auth/mock/code")
        public ApiResponse<String> getMockCode(@RequestParam String phone) {
            // 非 mock 模式（如真实 pxb 短信）下不报错，返回空，前端便捷自动填充自然跳过
            if (!(smsProvider instanceof MockSmsProvider mockProvider)) {
                return ApiResponse.ok(null);
            }
            return ApiResponse.ok(mockProvider.getCode(phone));
        }
    }
}
