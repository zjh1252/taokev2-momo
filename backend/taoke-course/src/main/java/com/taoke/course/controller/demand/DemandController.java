package com.taoke.course.controller.demand;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.api.DemandService;
import com.taoke.course.dto.demand.CreateDemandRequest;
import com.taoke.course.dto.demand.DemandDetailResponse;
import com.taoke.course.dto.demand.DemandListResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * C 端 — 培训需求接口
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Tag(name = "培训需求", description = "企业采购方发布与管理培训需求")
@RestController
@RequiredArgsConstructor
public class DemandController {

    private final DemandService demandService;

    @Operation(summary = "发布需求")
    @PostMapping("/demands")
    public ApiResponse<DemandDetailResponse> create(@Valid @RequestBody CreateDemandRequest request) {
        return ApiResponse.ok(demandService.create(SecurityUtils.getRequiredUserId(), request));
    }

    @Operation(summary = "我的需求列表")
    @GetMapping("/demands/mine")
    public ApiResponse<PageResponse<DemandListResponse>> listMine(
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(demandService.listByUser(SecurityUtils.getRequiredUserId(), status, page, size));
    }

    @Operation(summary = "需求详情")
    @GetMapping("/demands/{id}")
    public ApiResponse<DemandDetailResponse> detail(@PathVariable Integer id) {
        return ApiResponse.ok(demandService.getDetail(id, SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "取消需求")
    @PutMapping("/demands/{id}/cancel")
    public ApiResponse<Void> cancel(@PathVariable Integer id) {
        demandService.cancel(id, SecurityUtils.getRequiredUserId());
        return ApiResponse.ok();
    }
}
