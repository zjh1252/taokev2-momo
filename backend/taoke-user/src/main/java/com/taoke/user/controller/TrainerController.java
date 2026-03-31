package com.taoke.user.controller;

import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.dto.trainer.TrainerRequest;
import com.taoke.user.dto.trainer.TrainerResponse;
import com.taoke.user.dto.user.RoleApplicationStatusResponse;
import com.taoke.user.service.TrainerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 专家自服务接口 — TRAINER 角色扩展信息。
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Tag(name = "专家", description = "TRAINER 角色扩展信息管理")
@RestController
@RequiredArgsConstructor
public class TrainerController {

    private final TrainerService trainerService;

    @Operation(summary = "获取专家档案")
    @RequireRole(BusinessRole.Code.TRAINER)
    @GetMapping("/trainers/me")
    public ApiResponse<TrainerResponse> get() {
        return ApiResponse.ok(trainerService.getByUserId(SecurityUtils.getRequiredUserId()));
    }

    @Operation(summary = "保存专家档案（有则更新、无则创建）")
    @RequireRole(BusinessRole.Code.TRAINER)
    @PutMapping("/trainers/me")
    public ApiResponse<TrainerResponse> save(@Valid @RequestBody TrainerRequest request) {
        return ApiResponse.ok(trainerService.save(SecurityUtils.getRequiredUserId(), request));
    }

    @Operation(summary = "申请成为专家")
    @PostMapping("/trainers/apply")
    public ApiResponse<Void> apply(@Valid @RequestBody TrainerRequest request) {
        trainerService.apply(SecurityUtils.getRequiredUserId(), request);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "查看专家入驻申请状态")
    @GetMapping("/trainers/apply/status")
    public ApiResponse<RoleApplicationStatusResponse> getApplyStatus() {
        return ApiResponse.ok(trainerService.getApplyStatus(SecurityUtils.getRequiredUserId()));
    }
}
