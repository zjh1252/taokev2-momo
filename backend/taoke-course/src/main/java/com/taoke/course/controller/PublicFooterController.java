package com.taoke.course.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.course.api.PublicFooterService;
import com.taoke.course.dto.cms.PublicFooterVO;
import com.taoke.course.dto.cms.StaticPageVO;
import com.taoke.course.service.cms.FooterSupport;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * C 端底部栏公开接口
 *
 * @author Fangxinxin
 * @date 2026-07-20 16:40
 */
@Tag(name = "底部栏-公开")
@RestController
@RequiredArgsConstructor
public class PublicFooterController {

    private final PublicFooterService publicFooterService;

    @Public
    @Operation(summary = "获取首页底部栏配置")
    @GetMapping("/footer/public")
    public ApiResponse<PublicFooterVO> getPublicFooter() {
        return ApiResponse.ok(publicFooterService.getPublicFooter());
    }

    @Public
    @Operation(summary = "获取已发布静态页")
    @GetMapping("/pages/public/{slug}")
    public ApiResponse<StaticPageVO> getPublishedPage(@PathVariable String slug) {
        String pageCode = FooterSupport.toPageCode(slug);
        return ApiResponse.ok(publicFooterService.getPublishedPage(pageCode));
    }
}
