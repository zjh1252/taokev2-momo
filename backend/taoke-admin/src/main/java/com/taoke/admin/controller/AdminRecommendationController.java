package com.taoke.admin.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.course.api.RecommendedResourceService;
import com.taoke.course.dto.cms.AddRecommendedResourceRequest;
import com.taoke.course.dto.cms.RecommendedResourceItemVO;
import com.taoke.course.dto.cms.RecommendationSlotConfigVO;
import com.taoke.course.dto.cms.ReorderRecommendedResourcesRequest;
import com.taoke.course.dto.cms.UpdateRecommendationSlotConfigRequest;
import com.taoke.course.dto.cms.UpdateRecommendedResourceRequest;
import com.taoke.course.enums.RecommendationSlot;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 后台 — 推荐资源位管理（原型 1_1 ~ 4_1）
 *
 * @author Fangxinxin
 * @date 2026-06-12 18:30
 */
@Tag(name = "后台-推荐管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminRecommendationController {

    private final RecommendedResourceService recommendedResourceService;

    @Operation(summary = "推荐位元数据")
    @GetMapping("/admin/recommendations/slots")
    public ApiResponse<List<Map<String, String>>> listSlots(
            @RequestParam(required = false) String resourceType) {
        List<Map<String, String>> slots = Arrays.stream(RecommendationSlot.values())
                .filter(slot -> resourceType == null || slot.getResourceType().equalsIgnoreCase(resourceType))
                .map(slot -> {
                    Map<String, String> item = new LinkedHashMap<>();
                    item.put("code", slot.getCode());
                    item.put("label", slot.getLabel());
                    item.put("resourceType", slot.getResourceType());
                    return item;
                })
                .toList();
        return ApiResponse.ok(slots);
    }

    @Operation(summary = "查询推荐位已配置资源")
    @GetMapping("/admin/recommendations")
    public ApiResponse<List<RecommendedResourceItemVO>> list(
            @RequestParam String slotCode,
            @RequestParam(required = false) Integer categoryId) {
        return ApiResponse.ok(recommendedResourceService.listBySlot(slotCode, categoryId));
    }

    @Operation(summary = "添加推荐资源")
    @PostMapping("/admin/recommendations")
    public ApiResponse<RecommendedResourceItemVO> add(
            @Valid @RequestBody AddRecommendedResourceRequest request) {
        return ApiResponse.ok(recommendedResourceService.add(request));
    }

    @Operation(summary = "更新推荐资源详情")
    @PutMapping("/admin/recommendations/{id}")
    public ApiResponse<RecommendedResourceItemVO> update(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRecommendedResourceRequest request) {
        return ApiResponse.ok(recommendedResourceService.update(id, request));
    }

    @Operation(summary = "移除推荐资源")
    @DeleteMapping("/admin/recommendations/{id}")
    public ApiResponse<Void> remove(@PathVariable Integer id) {
        recommendedResourceService.remove(id);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "调整推荐资源排序")
    @PutMapping("/admin/recommendations/reorder")
    public ApiResponse<Void> reorder(@Valid @RequestBody ReorderRecommendedResourcesRequest request) {
        recommendedResourceService.reorder(request);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "查询推荐位布局配置")
    @GetMapping("/admin/recommendations/slots/{slotCode}/config")
    public ApiResponse<RecommendationSlotConfigVO> getSlotConfig(@PathVariable String slotCode) {
        return ApiResponse.ok(recommendedResourceService.getSlotConfig(slotCode));
    }

    @Operation(summary = "更新推荐位布局配置")
    @PutMapping("/admin/recommendations/slots/{slotCode}/config")
    public ApiResponse<RecommendationSlotConfigVO> updateSlotConfig(
            @PathVariable String slotCode,
            @RequestBody UpdateRecommendationSlotConfigRequest request) {
        return ApiResponse.ok(recommendedResourceService.updateSlotConfig(slotCode, request));
    }
}
