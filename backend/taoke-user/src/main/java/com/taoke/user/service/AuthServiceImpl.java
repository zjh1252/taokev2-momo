package com.taoke.user.service;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.eventbus.EventPublisher;
import com.taoke.common.events.user.NewUserRegisteredEvent;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.AuthService;
import com.taoke.user.api.VerificationCodeService;
import com.taoke.user.auth.LoginLockoutService;
import com.taoke.user.dto.auth.*;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import com.taoke.user.repository.UserRepository;
import com.taoke.user.repository.UserRoleRepository;
import com.taoke.user.security.JwtUtils;
import com.taoke.user.security.PermissionCacheService;
import com.taoke.user.security.SecurityUserService;
import com.taoke.user.ucenter.UcLoginResult;
import com.taoke.user.ucenter.UcenterClient;
import com.taoke.user.ucenter.UcenterProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
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
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final VerificationCodeService verificationCodeService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final SecurityUserService securityUserService;
    private final PermissionCacheService permissionCacheService;
    private final EventPublisher eventPublisher;
    private final UcenterProperties ucenterProperties;
    private final UcenterClient ucenterClient;
    private final LoginLockoutService loginLockoutService;

    @Value("${taoke.jwt.access-token-expire-ms:7200000}")
    private long accessTokenExpireMs;

    @Transactional
    @Override
    public TokenResponse loginByPassword(LoginRequest request) {
        if (ucenterProperties.isEnabled()) {
            User local = userRepository.findByPhone(request.getPhone()).orElse(null);
            // 本地管理账号（超管等）走本地 bcrypt，无需回填 UCenter，避免 uc_uid 脏写导致唯一键冲突
            if (local != null && !isLocalManagedAccount(local)) {
                backfillUcUidByPhone(local);
            }
            // 平台/本地管理账号（有本地密码、未关联 UCenter，如超管）始终走本地校验，不经 UCenter
            if (isLocalManagedAccount(local)) {
                return loginLocally(local, request.getPassword());
            }
            // 业务用户交给 UCenter；优先用本地已知的 UCenter 用户名，否则用手机号
            String account = (local != null && local.getUsername() != null && !local.getUsername().isBlank())
                    ? local.getUsername()
                    : request.getPhone();
            return ucenterLogin(account, request.getPassword());
        }

        User user = userRepository.findByPhone(request.getPhone())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));
        return loginLocally(user, request.getPassword());
    }

    /**
     * 验证码登录；未注册手机号自动开户并赋予默认 BUYER 角色。
     *
     * @param request 手机号与验证码
     * @return 访问令牌与刷新令牌
     */
    @Transactional
    @Override
    public TokenResponse loginBySms(SmsLoginRequest request) {
        verificationCodeService.verifyCode(request.getPhone(), request.getCode(), "LOGIN");

        boolean isNewUser = false;
        User user = userRepository.findByPhone(request.getPhone()).orElse(null);

        if (user == null) {
            // 账号体系以 UCenter 为准：开关开启时验证码注册/登录也要落到 UCenter
            if (ucenterProperties.isEnabled()) {
                UcLoginResult found = ucenterClient.lookupByMobile(request.getPhone());
                if (found.success()) {
                    // 老用户：懒补建并关联（provisionFromUcenter 内部会建角色并发事件，from_source=2）
                    user = provisionFromUcenter(found);
                } else {
                    user = registerOrProvisionSmsUser(request.getPhone());
                    isNewUser = Integer.valueOf(1).equals(user.getUserSource());
                }
            } else {
                user = createLocalSmsUser(request.getPhone());
                isNewUser = true;
            }
        } else if (ucenterProperties.isEnabled() && user.getUcUid() == null) {
            // 老的本地-only 用户：尝试按手机号反查 UCenter 回填 uc_uid
            backfillUcUidByPhone(user);
        }

        checkAccountStatus(user);
        TokenResponse tokenResponse = generateTokens(user);

        if (isNewUser) {
            tokenResponse.setNewUser(true);
            publishAfterCommit(new NewUserRegisteredEvent(user.getId(), user.getPhone()));
        }

        return tokenResponse;
    }

    /** 本地直建验证码用户（未接入 UCenter 时的原逻辑）。 */
    private User createLocalSmsUser(String phone) {
        User user = new User();
        user.setPhone(phone);
        user.setStatus(1);
        user.setRegOrigin(1);
        user = userRepository.save(user);
        addBuyerRole(user.getId());
        return user;
    }

    /**
     * 验证码登录时本地无账号：优先 UCenter 注册；若手机号已被占用则反查并懒补建。
     */
    private User registerOrProvisionSmsUser(String phone) {
        UcLoginResult found = ucenterClient.lookupByMobile(phone);
        if (found.success()) {
            return provisionFromUcenter(found);
        }
        try {
            return registerSmsUserToUcenter(phone);
        } catch (BusinessException e) {
            if (e.getErrorCode() != ErrorCode.ACCOUNT_EXISTS) {
                throw e;
            }
            UcLoginResult retry = ucenterClient.lookupByMobile(phone);
            if (!retry.success()) {
                log.warn("UCenter 手机号已占用但反查失败：phone={}", phone);
                throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE, "登录失败，请稍后重试");
            }
            return provisionFromUcenter(retry);
        }
    }

    /**
     * 新手机号通过验证码注册到 UCenter（随机密码），回填 uc_uid，from_source=1。
     * 不在此处发用户注册事件，由调用方按 isNewUser 统一发布。
     */
    private User registerSmsUserToUcenter(String phone) {
        String username = generateInternalUsername();
        String randomPassword = generateRandomPassword();
        int ucUid = ucenterRegister(username, randomPassword, "", phone);

        User user = new User();
        user.setPhone(phone);
        user.setUsername(username);
        user.setUcUid(ucUid);
        user.setUserSource(1);
        user.setStatus(1);
        user.setRegOrigin(1);
        user = userRepository.save(user);
        addBuyerRole(user.getId());
        return user;
    }

    /** 老的本地-only 用户登录时，尝试按手机号反查 UCenter 回填 uc_uid / username。 */
    private void backfillUcUidByPhone(User user) {
        if (user.getUcUid() != null) {
            return;
        }
        Integer prevUcUid = user.getUcUid();
        String prevUsername = user.getUsername();
        try {
            UcLoginResult found = ucenterClient.lookupByMobile(user.getPhone());
            if (!found.success()) {
                return;
            }
            User ucOwner = userRepository.findByUcUid(found.ucUid()).orElse(null);
            if (ucOwner != null && !ucOwner.getId().equals(user.getId())) {
                log.warn("UCenter uc_uid={} 已关联用户 id={}，跳过回填：phone={} userId={}",
                        found.ucUid(), ucOwner.getId(), user.getPhone(), user.getId());
                return;
            }
            user.setUcUid(found.ucUid());
            if ((user.getUsername() == null || user.getUsername().isBlank())
                    && found.username() != null && !found.username().isBlank()) {
                User nameOwner = userRepository.findByUsername(found.username()).orElse(null);
                if (nameOwner != null && !nameOwner.getId().equals(user.getId())) {
                    log.warn("UCenter username={} 已关联用户 id={}，跳过回填用户名：phone={} userId={}",
                            found.username(), nameOwner.getId(), user.getPhone(), user.getId());
                } else {
                    user.setUsername(found.username());
                }
            }
            userRepository.save(user);
        } catch (Exception e) {
            log.warn("按手机号反查 UCenter 回填失败：phone={}", user.getPhone(), e);
            user.setUcUid(prevUcUid);
            user.setUsername(prevUsername);
        }
    }

    @Transactional
    @Override
    public TokenResponse register(RegisterRequest request) {
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException(ErrorCode.ACCOUNT_EXISTS);
        }

        verificationCodeService.verifyCode(request.getPhone(), request.getCode(), "REGISTER");

        // 本地已删号但 UCenter 仍保留手机号：懒补建本地账号并重置密码，允许重新注册
        if (ucenterProperties.isEnabled()) {
            UcLoginResult found = ucenterClient.lookupByMobile(request.getPhone());
            if (found.success()) {
                User user = provisionFromUcenter(found);
                if (user.getUsername() != null && !user.getUsername().isBlank()) {
                    int rc = ucenterClient.editPassword(user.getUsername(), "", request.getPassword(), true);
                    if (rc <= 0) {
                        log.warn("UCenter 重置密码失败：username={} rc={}", user.getUsername(), rc);
                    }
                }
                TokenResponse tokenResponse = generateTokens(user);
                tokenResponse.setNewUser(true);
                return tokenResponse;
            }
        }

        User user = new User();
        user.setPhone(request.getPhone());
        user.setNickname(request.getNickname());
        user.setStatus(1);
        user.setRegOrigin(1);

        if (ucenterProperties.isEnabled()) {
            // UCenter 无空用户名，按老站习惯生成内部用户名；手机号写入 UCenter mobile
            String username = generateInternalUsername();
            int ucUid = ucenterRegister(username, request.getPassword(), "", request.getPhone());
            user.setUsername(username);
            user.setUcUid(ucUid);
            user.setUserSource(1);
        } else {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        user = userRepository.save(user);
        addBuyerRole(user.getId());

        TokenResponse tokenResponse = generateTokens(user);
        tokenResponse.setNewUser(true);
        publishAfterCommit(new NewUserRegisteredEvent(user.getId(), user.getPhone()));
        return tokenResponse;
    }

    @Override
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

    @Transactional
    @Override
    public TokenResponse loginByUsername(UsernameLoginRequest request) {
        if (ucenterProperties.isEnabled()) {
            User local = userRepository.findByUsername(request.getUsername()).orElse(null);
            if (local == null && request.getUsername().matches("^1\\d{10}$")) {
                local = userRepository.findByPhone(request.getUsername()).orElse(null);
            }
            if (local != null && !isLocalManagedAccount(local)) {
                backfillUcUidByPhone(local);
            }
            // 平台/本地管理账号始终走本地校验
            if (isLocalManagedAccount(local)) {
                return loginLocally(local, request.getPassword());
            }
            // 账号既可为老社区用户名也可为手机号，交给 UCenter 解析
            return ucenterLogin(request.getUsername(), request.getPassword());
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));
        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            throw new BusinessException(ErrorCode.PASSWORD_NOT_SET);
        }
        return loginLocally(user, request.getPassword());
    }

    @Transactional
    @Override
    public TokenResponse registerByUsername(UsernameRegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException(ErrorCode.USERNAME_TAKEN);
        }

        String nickname = request.getNickname();
        User user = new User();
        user.setUsername(request.getUsername());
        user.setNickname(nickname == null || nickname.isBlank() ? request.getUsername() : nickname);
        user.setStatus(1);
        user.setRegOrigin(1);

        if (ucenterProperties.isEnabled()) {
            int ucUid = ucenterRegister(request.getUsername(), request.getPassword(), "", null);
            user.setUcUid(ucUid);
            user.setUserSource(1);
        } else {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        user = userRepository.save(user);
        addBuyerRole(user.getId());

        TokenResponse tokenResponse = generateTokens(user);
        tokenResponse.setNewUser(true);
        publishAfterCommit(new NewUserRegisteredEvent(user.getId(), null));
        return tokenResponse;
    }

    @Override
    public boolean isUsernameAvailable(String username) {
        if (username == null || !username.matches("^[a-zA-Z0-9_]{4,32}$")) {
            return false;
        }
        return !userRepository.existsByUsername(username);
    }

    /**
     * 忘记密码 — 通过手机验证码重置密码
     */
    @Transactional
    @Override
    public void resetPassword(ResetPasswordRequest request) {
        verificationCodeService.verifyCode(request.getPhone(), request.getCode(), "RESET_PASSWORD");

        User user = resolveUserByPhone(request.getPhone());
        if (user == null) {
            if (ucenterProperties.isEnabled()) {
                UcLoginResult found = ucenterClient.lookupByMobile(request.getPhone());
                if (found.success() && found.username() != null && !found.username().isBlank()) {
                    resetUcenterPassword(found.username(), request.getNewPassword());
                    clearLoginLockoutByAccount(request.getPhone(), found.username());
                    return;
                }
            }
            throw new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND);
        }

        checkAccountStatus(user);

        // UCenter 用户：改密同步到 UCenter（忽略旧密码），本地不存储密码
        if (ucenterProperties.isEnabled()) {
            String username = resolveUcenterUsername(user);
            if (username != null) {
                resetUcenterPassword(username, request.getNewPassword());
                clearLoginLockout(user);
                return;
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        clearLoginLockout(user);
    }

    private void resetUcenterPassword(String username, String newPassword) {
        int rc = ucenterClient.editPassword(username, "", newPassword, true);
        if (rc < 0) {
            log.warn("UCenter 重置密码失败：username={} rc={}", username, rc);
            throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE);
        }
    }

    private void clearLoginLockoutByAccount(String phone, String username) {
        if (phone != null && !phone.isBlank()) {
            loginLockoutService.clear(phone);
        }
        if (username != null && !username.isBlank()) {
            loginLockoutService.clear(username);
        }
    }

    private void clearLoginLockout(User user) {
        loginLockoutService.clear(user.getPhone());
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            loginLockoutService.clear(user.getUsername());
        }
    }

    /**
     * 按手机号解析本地用户；UCenter 开启时若本地不存在则尝试反查并懒补建。
     */
    private User resolveUserByPhone(String phone) {
        User user = userRepository.findByPhone(phone).orElse(null);
        if (user != null) {
            backfillUcUidByPhone(user);
            return user;
        }
        if (!ucenterProperties.isEnabled()) {
            return null;
        }
        UcLoginResult found = ucenterClient.lookupByMobile(phone);
        if (!found.success()) {
            return null;
        }
        return provisionFromUcenter(found);
    }

    /**
     * 解析 UCenter 用户名；本地缺失时按手机号反查并回填。
     */
    private String resolveUcenterUsername(User user) {
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            return user.getUsername();
        }
        if (!ucenterProperties.isEnabled() || user.getPhone() == null || user.getPhone().isBlank()) {
            return null;
        }
        UcLoginResult found = ucenterClient.lookupByMobile(user.getPhone());
        if (!found.success() || found.username() == null || found.username().isBlank()) {
            return null;
        }
        user.setUcUid(found.ucUid());
        user.setUsername(found.username());
        userRepository.save(user);
        return found.username();
    }

    /**
     * 是否为本地管理账号：有本地密码且（未关联 UCenter，或为平台运营角色）。
     * 超管等运营账号即使已回填 uc_uid，后台仍走本地 bcrypt，避免 UCenter 密码不一致无法登录。
     */
    private boolean isLocalManagedAccount(User user) {
        if (user == null || user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            return false;
        }
        if (user.getUcUid() == null) {
            return true;
        }
        return hasPlatformOperatorRole(user.getId());
    }

    private boolean hasPlatformOperatorRole(Integer userId) {
        return userRoleRepository.findByUserIdAndStatus(userId, 1).stream()
                .map(UserRole::getRole)
                .anyMatch(AuthServiceImpl::isPlatformOperatorRole);
    }

    private static boolean isPlatformOperatorRole(String role) {
        return BusinessRole.Code.SUPER_ADMIN.equals(role)
                || BusinessRole.Code.PLATFORM_AUDITOR.equals(role)
                || BusinessRole.Code.PLATFORM_CS.equals(role);
    }

    /** 本地 bcrypt 密码校验并签发令牌。 */
    private TokenResponse loginLocally(User user, String rawPassword) {
        checkAccountStatus(user);
        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            throw new BusinessException(ErrorCode.PASSWORD_NOT_SET);
        }
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.PASSWORD_INCORRECT);
        }
        return generateTokens(user);
    }

    /* ==================== UCenter 接入辅助 ==================== */

    /**
     * 通过 UCenter 校验账号密码并签发本地令牌。
     * 校验通过后按 uc_uid 关联本地用户；不存在则懒补建（user_source=2）。
     *
     * @param account     登录标识（用户名 / 手机号）
     * @param rawPassword 明文密码
     */
    private TokenResponse ucenterLogin(String account, String rawPassword) {
        UcLoginResult result = ucenterClient.login(account, rawPassword);
        if (!result.success()) {
            if (result.status() == -2) {
                throw new BusinessException(ErrorCode.PASSWORD_INCORRECT);
            }
            throw new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND);
        }

        User user = userRepository.findByUcUid(result.ucUid())
                .orElseGet(() -> provisionFromUcenter(result));

        checkAccountStatus(user);
        return generateTokens(user);
    }

    /**
     * 老用户首次在新站登录时，按 UCenter 返回资料懒补建本地账号。
     * 优先关联已存在的本地账号（手机号/用户名/邮箱），避免唯一键冲突；否则新建（user_source=2）。
     */
    private User provisionFromUcenter(UcLoginResult result) {
        String mobile = blankToNull(result.mobile());
        String username = blankToNull(result.username());
        String email = blankToNull(result.email());

        User existing = null;
        if (mobile != null) {
            existing = userRepository.findByPhone(mobile).orElse(null);
        }
        if (existing == null && username != null) {
            existing = userRepository.findByUsername(username).orElse(null);
        }
        if (existing == null && email != null) {
            existing = userRepository.findByEmail(email).orElse(null);
        }
        if (existing != null) {
            User ucOwner = userRepository.findByUcUid(result.ucUid()).orElse(null);
            if (ucOwner != null && !ucOwner.getId().equals(existing.getId())) {
                throw new BusinessException(ErrorCode.UCENTER_UNAVAILABLE, "账号关联冲突，请联系客服处理");
            }
            if (existing.getUcUid() == null) {
                existing.setUcUid(result.ucUid());
            }
            if (Integer.valueOf(2).equals(existing.getUserSource())) {
                existing.setOldUser(true);
            }
            return userRepository.save(existing);
        }

        User user = new User();
        user.setUcUid(result.ucUid());
        user.setUserSource(2);
        user.setOldUser(true);
        user.setUsername(username);
        user.setPhone(mobile);
        user.setEmail(email);
        user.setNickname(username != null ? username : (mobile != null ? mobile : "用户" + result.ucUid()));
        user.setStatus(1);
        user.setRegOrigin(1);
        user = userRepository.save(user);

        addBuyerRole(user.getId());
        publishAfterCommit(new NewUserRegisteredEvent(user.getId(), user.getPhone()));
        return user;
    }

    /**
     * 向 UCenter 注册并返回 uc_uid；失败按错误码映射业务异常。
     */
    private int ucenterRegister(String username, String rawPassword, String email, String mobile) {
        int ucUid = ucenterClient.register(username, rawPassword, email, mobile);
        if (ucUid > 0) {
            return ucUid;
        }
        // 记录确切返回码，便于核对 UCenter 行为（对齐老站 regErrorMsg）
        log.warn("UCenter 注册失败：username={} mobile={} rc={}", username, mobile, ucUid);
        switch (ucUid) {
            case -8:
                throw new BusinessException(ErrorCode.ACCOUNT_EXISTS, "该手机号已注册，请直接登录");
            case -3:
                throw new BusinessException(ErrorCode.USERNAME_TAKEN);
            case -6:
                throw new BusinessException(ErrorCode.ACCOUNT_EXISTS, "该邮箱已被注册");
            case -7:
                // 手机检查失败：UCenter 注册强制要求有效手机号，多见于手机号已被占用 / 未提供手机号
                throw new BusinessException(ErrorCode.ACCOUNT_EXISTS, "该手机号已注册或不可用，请直接登录");
            case -9:
            case -10:
                throw new BusinessException(ErrorCode.INVALID_PHONE);
            case -1:
            case -2:
                throw new BusinessException(ErrorCode.USERNAME_INVALID);
            case -4:
            case -5:
                throw new BusinessException(ErrorCode.UCENTER_REGISTER_FAILED, "邮箱不可用");
            default:
                throw new BusinessException(ErrorCode.UCENTER_REGISTER_FAILED);
        }
    }

    /**
     * 生成内部用户名（手机号注册时使用，沿用老站 TPC_ 前缀风格），确保本地唯一。
     */
    private String generateInternalUsername() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder sb = new StringBuilder("TPC_");
            for (int i = 0; i < 6; i++) {
                sb.append((char) ('A' + ThreadLocalRandom.current().nextInt(26)));
            }
            String username = sb.append(date).toString();
            if (!userRepository.existsByUsername(username)) {
                return username;
            }
        }
        throw new BusinessException(ErrorCode.UCENTER_REGISTER_FAILED, "用户名生成失败，请重试");
    }

    /**
     * 生成随机密码（验证码注册时写入 UCenter，用户自身不感知，后续可走找回密码重设）。
     */
    private String generateRandomPassword() {
        String pool = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%";
        StringBuilder sb = new StringBuilder(16);
        for (int i = 0; i < 16; i++) {
            sb.append(pool.charAt(ThreadLocalRandom.current().nextInt(pool.length())));
        }
        return sb.toString();
    }

    /**
     * 为用户补默认 BUYER 角色（生效状态）。
     */
    private void addBuyerRole(Integer userId) {
        UserRole buyerRole = new UserRole();
        buyerRole.setUserId(userId);
        buyerRole.setRole(BusinessRole.Code.BUYER);
        buyerRole.setStatus(1);
        buyerRole.setApprovedAt(LocalDateTime.now());
        userRoleRepository.save(buyerRole);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
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

    /**
     * 事务提交后再发布领域事件，避免消费端读到未提交的数据
     */
    private void publishAfterCommit(com.taoke.common.eventbus.DomainEvent event) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    eventPublisher.publish(event);
                }
            });
        } else {
            eventPublisher.publish(event);
        }
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
