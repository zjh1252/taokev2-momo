package com.taoke.user.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.institution.InstitutionRequest;
import com.taoke.user.dto.institution.InstitutionResponse;
import com.taoke.user.service.InstitutionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 机构自服务接口 — INSTITUTION 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Tag(name = "机构", description = "INSTITUTION 角色扩展信息管理")
@RestController
@RequiredArgsConstructor
public class InstitutionController {

    private final InstitutionService institutionService;

    @Operation(summary = "获取机构信息")
    @GetMapping("/institutions/me")
    public ApiResponse<InstitutionResponse> get() {
        return ApiResponse.ok(institutionService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存机构信息（有则更新、无则创建）")
    @PutMapping("/institutions/me")
    public ApiResponse<InstitutionResponse> save(@Valid @RequestBody InstitutionRequest request) {
        return ApiResponse.ok(institutionService.save(SecurityUtils.getRequiredUserId(), request));
    }
}
