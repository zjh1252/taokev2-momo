package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.Public;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.InstitutionVenueService;
import com.taoke.user.dto.venue.InstitutionVenueRequest;
import com.taoke.user.dto.venue.InstitutionVenueResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 机构场地控制器 — 自服务 CRUD + 公开列表。
 *
 * @author Fangxinxin
 * @date 2026-04-21 17:00
 */
@Tag(name = "机构场地")
@RestController
@RequiredArgsConstructor
public class InstitutionVenueController {

    private final InstitutionVenueService venueService;

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "我的场地列表")
    @GetMapping("/institutions/me/venues")
    public ApiResponse<List<InstitutionVenueResponse>> listMyVenues() {
        return ApiResponse.ok(venueService.listMyVenues(SecurityUtils.getCurrentUserId()));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "新增场地")
    @PostMapping("/institutions/me/venues")
    public ApiResponse<InstitutionVenueResponse> createVenue(@Valid @RequestBody InstitutionVenueRequest request) {
        return ApiResponse.ok(venueService.createVenue(SecurityUtils.getCurrentUserId(), request));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "更新场地")
    @PutMapping("/institutions/me/venues/{id}")
    public ApiResponse<InstitutionVenueResponse> updateVenue(@PathVariable Integer id,
                                                              @Valid @RequestBody InstitutionVenueRequest request) {
        return ApiResponse.ok(venueService.updateVenue(SecurityUtils.getCurrentUserId(), id, request));
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "切换场地启停")
    @PutMapping("/institutions/me/venues/{id}/toggle-status")
    public ApiResponse<Void> toggleStatus(@PathVariable Integer id) {
        venueService.toggleStatus(SecurityUtils.getCurrentUserId(), id);
        return ApiResponse.ok();
    }

    @RequireRole(BusinessRole.Code.INSTITUTION)
    @Operation(summary = "删除场地")
    @DeleteMapping("/institutions/me/venues/{id}")
    public ApiResponse<Void> deleteVenue(@PathVariable Integer id) {
        venueService.deleteVenue(SecurityUtils.getCurrentUserId(), id);
        return ApiResponse.ok();
    }

    @Public
    @Operation(summary = "公开：机构场地列表（仅启用）")
    @GetMapping("/institutions/{id}/venues")
    public ApiResponse<List<InstitutionVenueResponse>> listPublicVenues(@PathVariable Integer id) {
        return ApiResponse.ok(venueService.listPublicByInstitutionId(id));
    }
}
