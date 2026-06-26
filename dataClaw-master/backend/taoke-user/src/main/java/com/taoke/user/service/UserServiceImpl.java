package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.api.UserService;
import com.taoke.user.api.VerificationCodeService;
import com.taoke.user.dto.user.ChangePasswordRequest;
import com.taoke.user.dto.user.ChangePhoneRequest;
import com.taoke.user.dto.user.UpdateProfileRequest;
import com.taoke.user.dto.user.UserProfileResponse;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import com.taoke.user.mapper.UserMapper;
import com.taoke.user.repository.UserRepository;
import com.taoke.user.repository.UserRoleRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * 用户自服务：个人信息查询/修改、密码管理、手机号变更。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationCodeService verificationCodeService;
    private final UserMapper userMapper;

    @Override
    public UserProfileResponse getProfile(Integer userId) {
        User user = findUser(userId);

        UserProfileResponse resp = userMapper.toProfileResponse(user);
        resp.setHasPassword(user.getPasswordHash() != null && !user.getPasswordHash().isEmpty());

        List<UserRole> userRoles = userRoleRepository.findByUserId(userId);
        resp.setRoles(userRoles.stream().map(userMapper::toRoleInfo).toList());

        return resp;
    }

    @Transactional
    @Override
    public void updateProfile(Integer userId, UpdateProfileRequest request) {
        User user = findUser(userId);

        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getRealName() != null) {
            user.setRealName(request.getRealName());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getStudyTags() != null) {
            user.setStudyTags(request.getStudyTags());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getPostCode() != null) {
            user.setPostCode(request.getPostCode());
        }
        if (request.getProvinceId() != null) {
            user.setProvinceId(request.getProvinceId());
        }
        if (request.getCityId() != null) {
            user.setCityId(request.getCityId());
        }
        if (request.getDistrictId() != null) {
            user.setDistrictId(request.getDistrictId());
        }
        if (request.getTownId() != null) {
            user.setTownId(request.getTownId());
        }
        if (request.getAddress() != null) {
            user.setAddress(request.getAddress());
        }

        userRepository.save(user);
    }

    /**
     * 修改密码（已登录状态）
     * <p>
     * 若用户尚未设置过密码（如手机验证码登录注册的用户），则直接设置新密码；
     * 否则必须提供正确的旧密码。
     */
    @Transactional
    @Override
    public void changePassword(Integer userId, ChangePasswordRequest request) {
        User user = findUser(userId);
        boolean hasPassword = user.getPasswordHash() != null && !user.getPasswordHash().isEmpty();

        if (hasPassword) {
            if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
                throw new BusinessException(ErrorCode.OLD_PASSWORD_INCORRECT, "请输入旧密码");
            }
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
                throw new BusinessException(ErrorCode.OLD_PASSWORD_INCORRECT);
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * 变更手机号（双验证码校验）
     * <p>
     * 先校验旧手机验证码，再校验新手机验证码，最后更新手机号。
     */
    @Transactional
    @Override
    public void changePhone(Integer userId, ChangePhoneRequest request) {
        User user = findUser(userId);

        // 校验旧手机验证码
        verificationCodeService.verifyCode(user.getPhone(), request.getOldPhoneCode(), "CHANGE_PHONE");

        // 校验新手机号是否已被绑定
        if (userRepository.existsByPhone(request.getNewPhone())) {
            throw new BusinessException(ErrorCode.PHONE_ALREADY_BOUND);
        }

        // 校验新手机验证码
        verificationCodeService.verifyCode(request.getNewPhone(), request.getNewPhoneCode(), "CHANGE_PHONE");

        user.setPhone(request.getNewPhone());
        userRepository.save(user);
    }

    @Transactional
    @Override
    public void updateStatus(Integer userId, Integer status, String freezeReason) {
        User user = findUser(userId);
        user.setStatus(status);
        user.setFreezeReason(freezeReason);
        userRepository.save(user);
    }

    @Override
    public Page<User> searchUsers(String search, Integer status, Pageable pageable) {
        Specification<User> spec = (root, cq, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim() + "%";
                predicates.add(cb.or(
                        cb.like(root.get("phone"), like),
                        cb.like(root.get("nickname"), like),
                        cb.like(root.get("realName"), like)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return userRepository.findAll(spec, pageable);
    }

    @Override
    public boolean existsById(Integer userId) {
        return userRepository.existsById(userId);
    }

    @Override
    public List<Integer> getActiveUserIds() {
        return userRepository.findByStatus(1).stream()
                .map(User::getId)
                .toList();
    }

    @Override
    public List<User> findAllByIds(List<Integer> ids) {
        return userRepository.findAllById(ids);
    }

    @Transactional
    @Override
    public User createCrawlerImportedUser(String preferredUsername, String nickname, String avatarUrl) {
        String username = uniqueCrawlerUsername(preferredUsername);

        User user = new User();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setNickname(normalizeText(nickname, username, 20));
        user.setRealName(normalizeText(nickname, "", 64));
        user.setAvatarUrl(normalizeText(avatarUrl, "", 512));
        user.setStatus(1);
        user.setRegOrigin(1);
        user = userRepository.save(user);

        UserRole buyerRole = new UserRole();
        buyerRole.setUserId(user.getId());
        buyerRole.setRole(com.taoke.common.enums.BusinessRole.Code.BUYER);
        buyerRole.setStatus(1);
        buyerRole.setApprovedAt(java.time.LocalDateTime.now());
        userRoleRepository.save(buyerRole);

        return user;
    }

    private String uniqueCrawlerUsername(String preferredUsername) {
        String base = preferredUsername == null ? "" : preferredUsername.toLowerCase(Locale.ROOT);
        base = base.replaceAll("[^a-z0-9_]", "_");
        base = base.replaceAll("_+", "_");
        if (base.length() < 4) {
            base = "crawl_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        }
        if (base.length() > 24) {
            base = base.substring(0, 24);
        }

        String candidate = base;
        int index = 1;
        while (userRepository.existsByUsername(candidate)) {
            String suffix = "_" + index++;
            int maxBaseLength = 32 - suffix.length();
            candidate = base.substring(0, Math.min(base.length(), maxBaseLength)) + suffix;
        }
        return candidate;
    }

    private String normalizeText(String value, String fallback, int maxLength) {
        String text = value == null || value.isBlank() ? fallback : value.trim();
        return text.length() > maxLength ? text.substring(0, maxLength) : text;
    }

    private User findUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));
    }
}
