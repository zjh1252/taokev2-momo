package com.taoke.user.api;

import com.taoke.user.dto.user.ChangePasswordRequest;
import com.taoke.user.dto.user.ChangePhoneRequest;
import com.taoke.user.dto.user.UpdateProfileRequest;
import com.taoke.user.dto.user.UserProfileResponse;

/**
 * 用户资料与账号相关能力（查询资料、修改资料、改密、改手机号、账号状态）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 12:00
 */
public interface UserService {

    /**
     * 根据用户 ID 查询用户资料。
     *
     * @param userId 用户 ID
     * @return 用户资料
     */
    UserProfileResponse getProfile(Integer userId);

    /**
     * 更新用户资料。
     *
     * @param userId  用户 ID
     * @param request 更新内容
     */
    void updateProfile(Integer userId, UpdateProfileRequest request);

    /**
     * 修改登录密码。
     *
     * @param userId  用户 ID
     * @param request 改密请求
     */
    void changePassword(Integer userId, ChangePasswordRequest request);

    /**
     * 修改绑定手机号。
     *
     * @param userId  用户 ID
     * @param request 改手机号请求
     */
    void changePhone(Integer userId, ChangePhoneRequest request);

    /**
     * 更新用户账号状态（如冻结等）。
     *
     * @param userId       用户 ID
     * @param status       状态值
     * @param freezeReason 冻结原因（非冻结场景可为空）
     */
    void updateStatus(Integer userId, Integer status, String freezeReason);
}
