package com.taoke.user.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.user.ChangePasswordRequest;
import com.taoke.user.dto.user.ChangePhoneRequest;
import com.taoke.user.dto.user.UpdateProfileRequest;
import com.taoke.user.dto.user.UserProfileResponse;
import com.taoke.user.api.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 用户自服务接口：个人基本信息、密码、手机号管理。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Tag(name = "用户自服务", description = "当前登录用户的个人信息管理")
@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "获取当前用户信息")
    @GetMapping("/users/me")
    public ApiResponse<UserProfileResponse> getProfile() {
        return ApiResponse.ok(userService.getProfile(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "修改个人基本资料")
    @PutMapping("/users/me")
    public ApiResponse<Void> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        userService.updateProfile(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "修改密码")
    @PutMapping("/users/me/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "变更手机号（双验证码校验）")
    @PutMapping("/users/me/phone")
    public ApiResponse<Void> changePhone(@Valid @RequestBody ChangePhoneRequest request) {
        userService.changePhone(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "注销账号（硬删除当前用户全部记录）")
    @DeleteMapping("/users/me")
    public ApiResponse<Void> deleteOwnAccount() {
        userService.deleteOwnAccount(SecurityUtils.getRequiredUserId());
        return ApiResponse.ok(null);
    }

    @Operation(summary = "注销单一身份（仅限非默认 BUYER 角色）")
    @DeleteMapping("/users/me/roles/{roleCode}")
    public ApiResponse<Void> withdrawRole(@PathVariable String roleCode) {
        userService.withdrawRole(SecurityUtils.getRequiredUserId(), roleCode);
        return ApiResponse.ok(null);
    }
}
