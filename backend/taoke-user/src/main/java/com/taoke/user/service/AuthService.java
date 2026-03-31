package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.auth.*;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import com.taoke.user.repository.UserRepository;
import com.taoke.user.repository.UserRoleRepository;
import com.taoke.user.security.JwtUtils;
import com.taoke.user.security.PermissionCacheService;
import com.taoke.user.security.SecurityUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 认证服务：注册、密码/验证码登录、刷新 Token、重置密码。
 *
 * @author Fangxinxin
 * @date 2026-03-31 11:00
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final VerificationCodeService verificationCodeService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final SecurityUserService securityUserService;
    private final PermissionCacheService permissionCacheService;

    @Value("${taoke.jwt.access-token-expire-ms:7200000}")
    private long accessTokenExpireMs;

    public TokenResponse loginByPassword(LoginRequest request) {
        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));

        checkAccountStatus(user);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.PASSWORD_INCORRECT);
        }

        return generateTokens(user);
    }

    /**
     * 验证码登录；未注册手机号自动开户并赋予默认 BUYER 角色。
     *
     * @param request 手机号与验证码
     * @return 访问令牌与刷新令牌
     */
    @Transactional
    public TokenResponse loginBySms(SmsLoginRequest request) {
        verificationCodeService.verifyCode(request.getPhone(), request.getCode(), "LOGIN");

        User user = userRepository.findByPhone(request.getPhone()).orElse(null);
        if (user == null) {
            user = new User();
            user.setPhone(request.getPhone());
            user.setStatus(1);
            user.setRegOrigin(1);
            user = userRepository.save(user);

            UserRole buyerRole = new UserRole();
            buyerRole.setUserId(user.getId());
            buyerRole.setRole(BusinessRole.Code.BUYER);
            buyerRole.setStatus(1);
            buyerRole.setApprovedAt(LocalDateTime.now());
            userRoleRepository.save(buyerRole);
        }

        checkAccountStatus(user);
        return generateTokens(user);
    }

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException(ErrorCode.ACCOUNT_EXISTS);
        }

        verificationCodeService.verifyCode(request.getPhone(), request.getCode(), "REGISTER");

        User user = new User();
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname());
        user.setStatus(1);
        user.setRegOrigin(1);
        user = userRepository.save(user);

        UserRole buyerRole = new UserRole();
        buyerRole.setUserId(user.getId());
        buyerRole.setRole(BusinessRole.Code.BUYER);
        buyerRole.setStatus(1);
        buyerRole.setApprovedAt(LocalDateTime.now());
        userRoleRepository.save(buyerRole);

        return generateTokens(user);
    }

    public TokenResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtUtils.isValid(refreshToken)) {
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED);
        }

        if (jwtUtils.isAccessToken(refreshToken)) {
            throw new BusinessException(ErrorCode.TOKEN_EXPIRED, "请使用 refreshToken");
        }

        Integer userId = jwtUtils.getUserId(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));

        checkAccountStatus(user);
        return generateTokens(user);
    }

    /**
     * 忘记密码 — 通过手机验证码重置密码
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        verificationCodeService.verifyCode(request.getPhone(), request.getCode(), "RESET_PASSWORD");

        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));

        checkAccountStatus(user);
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private TokenResponse generateTokens(User user) {
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        Set<String> businessRoles = userRoleRepository.findByUserIdAndStatus(user.getId(), 1)
                .stream()
                .map(UserRole::getRole)
                .collect(Collectors.toSet());

        String accessToken = jwtUtils.generateAccessToken(user.getId(), businessRoles);
        String refreshToken = jwtUtils.generateRefreshToken(user.getId());

        permissionCacheService.evict(user.getId());

        return new TokenResponse(accessToken, refreshToken, accessTokenExpireMs / 1000);
    }

    private void checkAccountStatus(User user) {
        if (user.getStatus() == 2) {
            throw new BusinessException(ErrorCode.ACCOUNT_FROZEN,
                    "账号已被冻结" + (user.getFreezeReason() != null ? "：" + user.getFreezeReason() : ""));
        }
        if (user.getStatus() == 3) {
            throw new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND, "该账号已注销");
        }
    }
}
