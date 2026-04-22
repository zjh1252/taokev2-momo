package com.taoke.admin.controller;

import com.taoke.admin.dto.*;
import com.taoke.admin.service.AdminInstitutionEmployeeService;
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
 * 后台 — 机构员工管理（列表 + 申请审核）。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Tag(name = "后台-机构员工管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminInstitutionEmployeeController {

    private final AdminInstitutionEmployeeService adminInstitutionEmployeeService;

    @Operation(summary = "分页查询机构员工列表")
    @GetMapping("/admin/institution-employees")
    public ApiResponse<PageResult<AdminInstitutionEmployeeVO>> list(AdminInstitutionEmployeeQuery query) {
        return ApiResponse.ok(adminInstitutionEmployeeService.listEmployees(query));
    }

    /**
     * 已废弃：机构员工申请审核已下放至机构在用户中心自行处理，平台不再受理。
     * <p>保留路由仅返回 410 提示，前端入口已下线。
     */
    private static final String GONE_MSG = "机构员工申请审核已下放至机构在用户中心办理，平台后台不再受理";

    @Operation(summary = "[已下线] 机构员工申请列表 — 改由机构在用户中心审核")
    @GetMapping("/admin/institution-employees/applications")
    public ApiResponse<PageResult<AdminInstitutionEmployeeApplicationVO>> listApplications(
            AdminInstitutionEmployeeApplicationQuery query) {
        throw new BusinessException(ErrorCode.FORBIDDEN, GONE_MSG);
    }

    @Operation(summary = "[已下线] 审核通过机构员工申请")
    @PutMapping("/admin/institution-employees/applications/{userId}/approve")
    public ApiResponse<Void> approve(@PathVariable Integer userId) {
        throw new BusinessException(ErrorCode.FORBIDDEN, GONE_MSG);
    }

    @Operation(summary = "[已下线] 驳回机构员工申请")
    @PutMapping("/admin/institution-employees/applications/{userId}/reject")
    public ApiResponse<Void> reject(@PathVariable Integer userId,
                                    @Valid @RequestBody RejectApplicationRequest request) {
        throw new BusinessException(ErrorCode.FORBIDDEN, GONE_MSG);
    }
}
