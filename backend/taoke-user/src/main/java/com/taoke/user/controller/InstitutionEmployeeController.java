package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeRequest;
import com.taoke.user.dto.institutionemployee.InstitutionEmployeeResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.api.InstitutionEmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 机构员工自服务接口 — INSTITUTION_EMPLOYEE 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Tag(name = "机构员工", description = "INSTITUTION_EMPLOYEE 角色扩展信息管理")
@RestController
@RequiredArgsConstructor
public class InstitutionEmployeeController {

    private final InstitutionEmployeeService institutionEmployeeService;

    @Operation(summary = "获取机构员工信息")
    @RequireRole(BusinessRole.Code.INSTITUTION_EMPLOYEE)
    @GetMapping("/institution-employees/me")
    public ApiResponse<InstitutionEmployeeResponse> get() {
        return ApiResponse.ok(institutionEmployeeService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存机构员工信息（有则更新、无则创建）")
    @RequireRole(BusinessRole.Code.INSTITUTION_EMPLOYEE)
    @PutMapping("/institution-employees/me")
    public ApiResponse<InstitutionEmployeeResponse> save(@Valid @RequestBody InstitutionEmployeeRequest request) {
        return ApiResponse.ok(institutionEmployeeService.save(SecurityUtils.getRequiredUserId(), request));
    }

    @Operation(summary = "申请成为机构员工")
    @PostMapping("/institution-employees/apply")
    public ApiResponse<Void> apply(@Valid @RequestBody InstitutionEmployeeRequest request) {
        institutionEmployeeService.apply(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "查看机构员工入驻申请状态")
    @GetMapping("/institution-employees/apply/status")
    public ApiResponse<RoleApplicationStatusResponse> getApplyStatus() {
        return ApiResponse.ok(institutionEmployeeService.getApplyStatus(SecurityUtils.getRequiredUserId()));
    }
}
