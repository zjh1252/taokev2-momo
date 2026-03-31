package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.*;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import com.taoke.user.entity.VerificationCode;
import com.taoke.user.repository.UserRepository;
import com.taoke.user.repository.UserRoleRepository;
import com.taoke.user.repository.VerificationCodeRepository;
import com.taoke.user.security.JwtUtils;
import com.taoke.user.security.PermissionCacheService;
import com.taoke.user.security.SecurityUser;
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
 * 认证服务 — 注册、密码登录、验证码登录、Token 刷新
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final SecurityUserService securityUserService;
    private final PermissionCacheService permissionCacheService;

    @Value("${taoke.jwt.access-token-expire-ms:7200000}")
    private long accessTokenExpireMs;

    /**
     * 手机号 + 密码登录
     */
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
     * 手机号 + 验证码登录（未注册用户自动创建账号）
     */
    @Transactional
    public TokenResponse loginBySms(SmsLoginRequest request) {
        verifyCode(request.getPhone(), request.getCode(), "LOGIN");

        User user = userRepository.findByPhone(request.getPhone()).orElse(null);
        if (user == null) {
            // 自动注册
            user = new User();
            user.setPhone(request.getPhone());
            user.setStatus(1);
            user.setRegOrigin(1);
            user = userRepository.save(user);

            // 默认分配 BUYER 角色
            UserRole buyerRole = new UserRole();
            buyerRole.setUserId(user.getId());
            buyerRole.setRole("BUYER");
            buyerRole.setStatus(1);
            buyerRole.setApprovedAt(LocalDateTime.now());
            userRoleRepository.save(buyerRole);
        }

        checkAccountStatus(user);
        return generateTokens(user);
    }

    /**
     * 注册（手机号 + 验证码 + 密码）
     */
    @Transactional
    public TokenResponse register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException(ErrorCode.ACCOUNT_EXISTS);
        }

        verifyCode(request.getPhone(), request.getCode(), "REGISTER");

        User user = new User();
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname());
        user.setStatus(1);
        user.setRegOrigin(1);
        user = userRepository.save(user);

        // 默认分配 BUYER 角色
        UserRole buyerRole = new UserRole();
        buyerRole.setUserId(user.getId());
        buyerRole.setRole("BUYER");
        buyerRole.setStatus(1);
        buyerRole.setApprovedAt(LocalDateTime.now());
        userRoleRepository.save(buyerRole);

        return generateTokens(user);
    }

    /**
     * 刷新 Token
     */
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

    private TokenResponse generateTokens(User user) {
        // 更新最近登录时间
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        Set<String> businessRoles = userRoleRepository.findByUserIdAndStatus(user.getId(), 1)
                .stream()
                .map(UserRole::getRole)
                .collect(Collectors.toSet());

        String accessToken = jwtUtils.generateAccessToken(user.getId(), businessRoles);
        String refreshToken = jwtUtils.generateRefreshToken(user.getId());

        // 清除缓存，确保新令牌使用最新权限
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

    private void verifyCode(String phone, String code, String type) {
        VerificationCode vc = verificationCodeRepository
                .findFirstByTargetAndTypeAndIsUsedAndExpiresAtAfterOrderByCreatedAtDesc(
                        phone, type, 0, LocalDateTime.now())
                .orElseThrow(() -> new BusinessException(ErrorCode.CAPTCHA_EXPIRED));

        if (!vc.getCode().equals(code)) {
            throw new BusinessException(ErrorCode.CAPTCHA_INCORRECT);
        }

        // 标记已使用
        vc.setIsUsed(1);
        verificationCodeRepository.save(vc);
    }
}
