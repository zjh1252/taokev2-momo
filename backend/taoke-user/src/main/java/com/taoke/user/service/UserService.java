package com.taoke.user.service;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.user.dto.user.ChangePasswordRequest;
import com.taoke.user.dto.user.ChangePhoneRequest;
import com.taoke.user.dto.user.UpdateProfileRequest;
import com.taoke.user.dto.user.UserProfileResponse;
import com.taoke.user.entity.User;
import com.taoke.user.entity.UserRole;
import com.taoke.user.mapper.UserMapper;
import com.taoke.user.repository.UserRepository;
import com.taoke.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 用户自服务：个人信息查询/修改、密码管理、手机号变更。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationCodeService verificationCodeService;
    private final UserMapper userMapper;

    public UserProfileResponse getProfile(Integer userId) {
        User user = findUser(userId);

        UserProfileResponse resp = userMapper.toProfileResponse(user);
        resp.setHasPassword(user.getPasswordHash() != null && !user.getPasswordHash().isEmpty());

        List<UserRole> userRoles = userRoleRepository.findByUserId(userId);
        resp.setRoles(userRoles.stream().map(userMapper::toRoleInfo).toList());

        return resp;
    }

    @Transactional
    public void updateProfile(Integer userId, UpdateProfileRequest request) {
        User user = findUser(userId);

        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
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

    private User findUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ACCOUNT_NOT_FOUND));
    }
}
