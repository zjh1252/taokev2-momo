package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.agent.AgentRequest;
import com.taoke.user.dto.agent.AgentResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.service.AgentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 专家经纪人自服务接口 — AGENT 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Tag(name = "专家经纪人", description = "AGENT 角色扩展信息管理")
@RestController
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;

    @Operation(summary = "获取经纪人档案")
    @RequireRole(BusinessRole.Code.AGENT)
    @GetMapping("/agents/me")
    public ApiResponse<AgentResponse> get() {
        return ApiResponse.ok(agentService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存经纪人档案（有则更新、无则创建）")
    @RequireRole(BusinessRole.Code.AGENT)
    @PutMapping("/agents/me")
    public ApiResponse<AgentResponse> save(@Valid @RequestBody AgentRequest request) {
        return ApiResponse.ok(agentService.save(SecurityUtils.getRequiredUserId(), request));
    }

    @Operation(summary = "申请成为专家经纪人")
    @PostMapping("/agents/apply")
    public ApiResponse<Void> apply(@Valid @RequestBody AgentRequest request) {
        agentService.apply(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "查看经纪人入驻申请状态")
    @GetMapping("/agents/apply/status")
    public ApiResponse<RoleApplicationStatusResponse> getApplyStatus() {
        return ApiResponse.ok(agentService.getApplyStatus(SecurityUtils.getRequiredUserId()));
    }
}
