package com.taoke.course.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.course.api.PublicRecommendationService;
import com.taoke.course.dto.cms.PublicRecommendedItemVO;
import com.taoke.course.dto.cms.RecommendationSlotConfigVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * C 端公开推荐位接口
 *
 * @author Fangxinxin
 * @date 2026-06-12 20:00
 */
@Tag(name = "推荐位-公开", description = "C 端按 slot 读取运营配置的推荐资源")
@RestController
public class PublicRecommendationController {

    private final PublicRecommendationService publicRecommendationService;

    public PublicRecommendationController(PublicRecommendationService publicRecommendationService) {
        this.publicRecommendationService = publicRecommendationService;
    }

    @Public
    @Operation(summary = "按推荐位查询公开推荐资源")
    @GetMapping("/recommendations/public")
    public ApiResponse<List<PublicRecommendedItemVO>> listPublic(
            @RequestParam String slotCode,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "false") boolean includeBackup) {
        return ApiResponse.ok(
                publicRecommendationService.listPublic(slotCode, categoryId, limit, includeBackup));
    }

    @Public
    @Operation(summary = "推荐位布局配置（如首页大卡是否固定）")
    @GetMapping("/recommendations/public/config")
    public ApiResponse<RecommendationSlotConfigVO> getPublicConfig(@RequestParam String slotCode) {
        return ApiResponse.ok(publicRecommendationService.getPublicSlotConfig(slotCode));
    }
}
