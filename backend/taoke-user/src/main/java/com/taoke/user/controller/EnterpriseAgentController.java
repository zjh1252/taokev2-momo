package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.enterpriseagent.EnterpriseAgentRequest;
import com.taoke.user.dto.enterpriseagent.EnterpriseAgentResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.service.EnterpriseAgentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 专家经纪公司自服务接口 — ENTERPRISE_AGENT 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Tag(name = "专家经纪公司", description = "ENTERPRISE_AGENT 角色扩展信息管理")
@RestController
@RequiredArgsConstructor
public class EnterpriseAgentController {

    private final EnterpriseAgentService enterpriseAgentService;

    @Operation(summary = "获取专家经纪公司信息")
    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @GetMapping("/enterprise-agents/me")
    public ApiResponse<EnterpriseAgentResponse> get() {
        return ApiResponse.ok(enterpriseAgentService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存专家经纪公司信息（有则更新、无则创建）")
    @RequireRole(BusinessRole.Code.ENTERPRISE_AGENT)
    @PutMapping("/enterprise-agents/me")
    public ApiResponse<EnterpriseAgentResponse> save(@Valid @RequestBody EnterpriseAgentRequest request) {
        return ApiResponse.ok(enterpriseAgentService.save(SecurityUtils.getRequiredUserId(), request));
    }

    @Operation(summary = "申请成为专家经纪公司")
    @PostMapping("/enterprise-agents/apply")
    public ApiResponse<Void> apply(@Valid @RequestBody EnterpriseAgentRequest request) {
        enterpriseAgentService.apply(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "查看经纪公司入驻申请状态")
    @GetMapping("/enterprise-agents/apply/status")
    public ApiResponse<RoleApplicationStatusResponse> getApplyStatus() {
        return ApiResponse.ok(enterpriseAgentService.getApplyStatus(SecurityUtils.getRequiredUserId()));
    }
}
