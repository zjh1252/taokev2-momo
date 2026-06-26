package com.taoke.user.api;

import com.taoke.user.dto.auth.LoginRequest;
import com.taoke.user.dto.auth.RefreshTokenRequest;
import com.taoke.user.dto.auth.RegisterRequest;
import com.taoke.user.dto.auth.ResetPasswordRequest;
import com.taoke.user.dto.auth.SmsLoginRequest;
import com.taoke.user.dto.auth.TokenResponse;
import com.taoke.user.dto.auth.UsernameLoginRequest;
import com.taoke.user.dto.auth.UsernameRegisterRequest;

/**
 * 认证与令牌相关能力（密码登录、短信登录、注册、刷新令牌、重置密码）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface AuthService {

    /**
     * 账号密码登录。
     *
     * @param request 登录请求
     * @return 访问令牌等信息
     */
    TokenResponse loginByPassword(LoginRequest request);

    /**
     * 短信验证码登录。
     *
     * @param request 短信登录请求
     * @return 访问令牌等信息
     */
    TokenResponse loginBySms(SmsLoginRequest request);

    /**
     * 用户注册。
     *
     * @param request 注册请求
     * @return 访问令牌等信息
     */
    TokenResponse register(RegisterRequest request);

    /**
     * 使用刷新令牌换取新的访问令牌。
     *
     * @param request 刷新令牌请求
     * @return 新的访问令牌等信息
     */
    TokenResponse refreshToken(RefreshTokenRequest request);

    /**
     * 重置密码（通常配合验证码流程）。
     *
     * @param request 重置密码请求
     */
    void resetPassword(ResetPasswordRequest request);

    /**
     * 账号 + 密码登录。
     *
     * @param request 登录请求
     * @return 访问令牌等信息
     */
    TokenResponse loginByUsername(UsernameLoginRequest request);

    /**
     * 账号 + 密码注册（无手机号、无邮箱）。
     *
     * @param request 注册请求
     * @return 访问令牌等信息
     */
    TokenResponse registerByUsername(UsernameRegisterRequest request);

    /**
     * 判断账号是否可用。
     *
     * @param username 账号
     * @return true 表示尚未被占用
     */
    boolean isUsernameAvailable(String username);
}
