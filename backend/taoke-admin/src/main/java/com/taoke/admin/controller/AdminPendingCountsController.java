package com.taoke.admin.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.course.api.DemandService;
import com.taoke.course.enums.DemandStatus;
import com.taoke.user.api.UserRoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 后台 — 侧边栏待办数量（需求、角色申请等）
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:30
 */
@Tag(name = "后台-待办统计")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminPendingCountsController {

    private final DemandService demandService;
    private final UserRoleService userRoleService;

    @Operation(summary = "各菜单待处理数量")
    @GetMapping("/admin/stats/pending-counts")
    public ApiResponse<Map<String, Long>> pendingCounts() {
        Map<String, Long> data = new LinkedHashMap<>();
        data.put("/dashboard/demands",
                demandService.countByStatus(DemandStatus.SUBMITTED.getValue()));
        data.put("/dashboard/trainers/applications",
                userRoleService.countPendingApplications(BusinessRole.Code.TRAINER));
        data.put("/dashboard/institutions/applications",
                userRoleService.countPendingApplications(BusinessRole.Code.INSTITUTION));
        data.put("/dashboard/enterprise-agents/applications",
                userRoleService.countPendingApplications(BusinessRole.Code.ENTERPRISE_AGENT));
        return ApiResponse.ok(data);
    }
}
