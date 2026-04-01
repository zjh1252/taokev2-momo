package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerRequest;
import com.taoke.user.dto.enterprisebuyer.EnterpriseBuyerResponse;
import com.taoke.user.api.EnterpriseBuyerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 企业培训采购方自服务接口 — ENTERPRISE_BUYER 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31
 */
@Tag(name = "企业培训采购方", description = "ENTERPRISE_BUYER 角色扩展信息管理")
@RestController
@RequiredArgsConstructor
public class EnterpriseBuyerController {

    private final EnterpriseBuyerService enterpriseBuyerService;

    @Operation(summary = "获取企业培训采购方信息")
    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    @GetMapping("/enterprise-buyers/me")
    public ApiResponse<EnterpriseBuyerResponse> get() {
        return ApiResponse.ok(enterpriseBuyerService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存企业培训采购方信息（有则更新、无则创建）")
    @RequireRole(BusinessRole.Code.ENTERPRISE_BUYER)
    @PutMapping("/enterprise-buyers/me")
    public ApiResponse<EnterpriseBuyerResponse> save(@Valid @RequestBody EnterpriseBuyerRequest request) {
        return ApiResponse.ok(enterpriseBuyerService.save(SecurityUtils.getRequiredUserId(), request));
    }
}
