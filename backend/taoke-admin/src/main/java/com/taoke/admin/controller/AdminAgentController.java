package com.taoke.admin.controller;

import com.taoke.admin.dto.*;
import com.taoke.admin.service.AdminAgentService;
import com.taoke.common.dto.PageResult;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 后台 — 专家经纪人管理（列表 + 申请审核）。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Tag(name = "后台-专家经纪人管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminAgentController {

    private final AdminAgentService adminAgentService;

    @Operation(summary = "分页查询经纪人列表")
    @GetMapping("/admin/agents")
    public ApiResponse<PageResult<AdminAgentVO>> list(AdminAgentQuery query) {
        return ApiResponse.ok(adminAgentService.listAgents(query));
    }

    private static final String GONE_MSG = "经纪人申请审核已下放至经纪公司在用户中心办理，平台后台不再受理";

    @Operation(summary = "[已下线] 经纪人申请列表 — 改由经纪公司在用户中心审核")
    @GetMapping("/admin/agents/applications")
    public ApiResponse<PageResult<AdminAgentApplicationVO>> listApplications(AdminAgentApplicationQuery query) {
        throw new BusinessException(ErrorCode.FORBIDDEN, GONE_MSG);
    }

    @Operation(summary = "[已下线] 审核通过经纪人申请")
    @PutMapping("/admin/agents/applications/{userId}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer userId) {
        throw new BusinessException(ErrorCode.FORBIDDEN, GONE_MSG);
    }

    @Operation(summary = "[已下线] 驳回经纪人申请")
    @PutMapping("/admin/agents/applications/{userId}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer userId,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        throw new BusinessException(ErrorCode.FORBIDDEN, GONE_MSG);
    }
}
