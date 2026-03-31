package com.taoke.user.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.buyer.BuyerRequest;
import com.taoke.user.dto.buyer.BuyerResponse;
import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerRequest;
import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerResponse;
import com.taoke.user.dto.user.ChangePasswordRequest;
import com.taoke.user.dto.user.ChangePhoneRequest;
import com.taoke.user.dto.user.UpdateProfileRequest;
import com.taoke.user.dto.user.UserProfileResponse;
import com.taoke.user.service.BuyerService;
import com.taoke.user.service.EnterpriseBuyerService;
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
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final EnterpriseBuyerService enterpriseBuyerService;
    private final BuyerService buyerService;

    /* ======================== 基本信息 ======================== */

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

    /* ======================== 密码管理 ======================== */

    @Operation(summary = "修改密码")
    @PutMapping("/users/me/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    /* ======================== 手机号变更 ======================== */

    @Operation(summary = "变更手机号（双验证码校验）")
    @PutMapping("/users/me/phone")
    public ApiResponse<Void> changePhone(@Valid @RequestBody ChangePhoneRequest request) {
        userService.changePhone(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    /* ======================== 企业培训采购方信息（ENTERPRISE_BUYER） ======================== */

    @Operation(summary = "获取企业培训采购方信息")
    @GetMapping("/users/me/enterprise")
    public ApiResponse<EnterpriseBuyerResponse> getEnterpriseBuyer() {
        return ApiResponse.ok(enterpriseBuyerService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存企业培训采购方信息（有则更新、无则创建）")
    @PutMapping("/users/me/enterprise")
    public ApiResponse<EnterpriseBuyerResponse> saveEnterpriseBuyer(@Valid @RequestBody EnterpriseBuyerRequest request) {
        return ApiResponse.ok(enterpriseBuyerService.save(SecurityUtils.getRequiredUserId(), request));
    }

    /* ======================== 学员档案（BUYER） ======================== */

    @Operation(summary = "获取学员档案")
    @GetMapping("/users/me/buyer")
    public ApiResponse<BuyerResponse> getBuyer() {
        return ApiResponse.ok(buyerService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存学员档案（有则更新、无则创建）")
    @PutMapping("/users/me/buyer")
    public ApiResponse<BuyerResponse> saveBuyer(@Valid @RequestBody BuyerRequest request) {
        return ApiResponse.ok(buyerService.save(SecurityUtils.getRequiredUserId(), request));
    }
}
