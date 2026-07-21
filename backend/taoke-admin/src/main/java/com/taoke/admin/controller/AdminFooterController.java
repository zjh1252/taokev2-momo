package com.taoke.admin.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.course.api.FooterService;
import com.taoke.course.dto.cms.*;
import com.taoke.course.service.cms.FooterSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 后台 — 底部栏管理
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Tag(name = "后台-底部管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminFooterController {

    private final FooterService footerService;

    @Operation(summary = "获取底部栏完整配置")
    @GetMapping("/admin/footer")
    public ApiResponse<AdminFooterVO> getFooter() {
        return ApiResponse.ok(footerService.getAdminFooter());
    }

    @Operation(summary = "更新底部全局配置")
    @PutMapping("/admin/footer/config")
    public ApiResponse<FooterConfigVO> updateConfig(@Valid @RequestBody UpdateFooterConfigRequest request) {
        return ApiResponse.ok(footerService.updateConfig(request));
    }

    @Operation(summary = "更新底部链接项")
    @PutMapping("/admin/footer/links/{itemCode}")
    public ApiResponse<FooterLinkVO> updateLink(
            @PathVariable String itemCode,
            @Valid @RequestBody UpdateFooterLinkRequest request) {
        return ApiResponse.ok(footerService.updateLink(itemCode, request));
    }

    @Operation(summary = "获取静态页")
    @GetMapping("/admin/footer/pages/{pageCode}")
    public ApiResponse<StaticPageVO> getPage(@PathVariable String pageCode) {
        return ApiResponse.ok(footerService.getPage(pageCode));
    }

    @Operation(summary = "更新静态页")
    @PutMapping("/admin/footer/pages/{pageCode}")
    public ApiResponse<StaticPageVO> updatePage(
            @PathVariable String pageCode,
            @Valid @RequestBody UpdateStaticPageRequest request) {
        return ApiResponse.ok(footerService.updatePage(pageCode, request));
    }

    @Operation(summary = "按 slug 获取静态页（后台预览）")
    @GetMapping("/admin/footer/pages/slug/{slug}")
    public ApiResponse<StaticPageVO> getPageBySlug(@PathVariable String slug) {
        return ApiResponse.ok(footerService.getPage(FooterSupport.toPageCode(slug)));
    }
}
