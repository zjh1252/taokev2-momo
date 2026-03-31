package com.taoke.user.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.assistant.AssistantRequest;
import com.taoke.user.dto.assistant.AssistantResponse;
import com.taoke.user.service.AssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 专家助理自服务接口 — ASSISTANT 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Tag(name = "专家助理", description = "ASSISTANT 角色扩展信息管理")
@RestController
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService;

    @Operation(summary = "获取助理档案")
    @GetMapping("/assistants/me")
    public ApiResponse<AssistantResponse> get() {
        return ApiResponse.ok(assistantService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存助理档案（有则更新、无则创建）")
    @PutMapping("/assistants/me")
    public ApiResponse<AssistantResponse> save(@Valid @RequestBody AssistantRequest request) {
        return ApiResponse.ok(assistantService.save(SecurityUtils.getRequiredUserId(), request));
    }
}
