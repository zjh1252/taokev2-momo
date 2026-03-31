package com.taoke.user.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.buyer.BuyerProfileRequest;
import com.taoke.user.dto.buyer.BuyerProfileResponse;
import com.taoke.user.dto.enterprise.EnterpriseInfoRequest;
import com.taoke.user.dto.enterprise.EnterpriseInfoResponse;
import com.taoke.user.dto.user.ChangePasswordRequest;
import com.taoke.user.dto.user.ChangePhoneRequest;
import com.taoke.user.dto.user.UpdateProfileRequest;
import com.taoke.user.dto.user.UserProfileResponse;
import com.taoke.user.service.BuyerProfileService;
import com.taoke.user.service.EnterpriseService;
import com.taoke.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 用户自服务接口：个人信息、密码、手机号、角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 14:00
 */
@Tag(name = "用户自服务", description = "当前登录用户的个人信息管理")
@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final EnterpriseService enterpriseService;
    private final BuyerProfileService buyerProfileService;

    /* ======================== 基本信息 ======================== */

    @Operation(summary = "获取当前用户信息")
    @GetMapping
    public ApiResponse<UserProfileResponse> getProfile() {
        return ApiResponse.ok(userService.getProfile(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "修改个人基本资料")
    @PutMapping
    public ApiResponse<Void> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        userService.updateProfile(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    /* ======================== 密码管理 ======================== */

    @Operation(summary = "修改密码")
    @PutMapping("/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    /* ======================== 手机号变更 ======================== */

    @Operation(summary = "变更手机号（双验证码校验）")
    @PutMapping("/phone")
    public ApiResponse<Void> changePhone(@Valid @RequestBody ChangePhoneRequest request) {
        userService.changePhone(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    /* ======================== 企业信息（ENTERPRISE_BUYER） ======================== */

    @Operation(summary = "获取企业信息")
    @GetMapping("/enterprise")
    public ApiResponse<EnterpriseInfoResponse> getEnterprise() {
        return ApiResponse.ok(enterpriseService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存企业信息（有则更新、无则创建）")
    @PutMapping("/enterprise")
    public ApiResponse<EnterpriseInfoResponse> saveEnterprise(@Valid @RequestBody EnterpriseInfoRequest request) {
        return ApiResponse.ok(enterpriseService.save(SecurityUtils.getRequiredUserId(), request));
    }

    /* ======================== 学员档案（BUYER） ======================== */

    @Operation(summary = "获取学员档案")
    @GetMapping("/buyer-profile")
    public ApiResponse<BuyerProfileResponse> getBuyerProfile() {
        return ApiResponse.ok(buyerProfileService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存学员档案（有则更新、无则创建）")
    @PutMapping("/buyer-profile")
    public ApiResponse<BuyerProfileResponse> saveBuyerProfile(@Valid @RequestBody BuyerProfileRequest request) {
        return ApiResponse.ok(buyerProfileService.save(SecurityUtils.getRequiredUserId(), request));
    }
}
