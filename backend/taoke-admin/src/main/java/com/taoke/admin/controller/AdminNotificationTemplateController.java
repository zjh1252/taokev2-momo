package com.taoke.admin.controller;

import com.taoke.admin.dto.SaveNotificationTemplateRequest;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.user.api.NotificationTemplateService;
import com.taoke.user.dto.notification.NotificationTemplateVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 后台 — 通知模板管理（CRUD）。
 *
 * @author Fangxinxin
 * @date 2026-04-02 18:00
 */
@Tag(name = "后台-通知模板管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminNotificationTemplateController {

    private final NotificationTemplateService templateService;

    @Operation(summary = "获取全部通知模板")
    @GetMapping("/admin/notification-templates")
    public ApiResponse<List<NotificationTemplateVO>> list() {
        return ApiResponse.ok(templateService.list());
    }

    @Operation(summary = "创建通知模板")
    @PostMapping("/admin/notification-templates")
    public ApiResponse<NotificationTemplateVO> create(
            @Valid @RequestBody SaveNotificationTemplateRequest request) {
        return ApiResponse.ok(templateService.create(
                request.getCode(), request.getChannel(), request.getLang(),
                request.getTitleTemplate(), request.getContentTemplate(),
                request.getEnabled(), request.getRemark()));
    }

    @Operation(summary = "编辑通知模板")
    @PutMapping("/admin/notification-templates/{id}")
    public ApiResponse<NotificationTemplateVO> update(
            @PathVariable Integer id,
            @Valid @RequestBody SaveNotificationTemplateRequest request) {
        return ApiResponse.ok(templateService.update(
                id, request.getCode(), request.getChannel(), request.getLang(),
                request.getTitleTemplate(), request.getContentTemplate(),
                request.getEnabled(), request.getRemark()));
    }

    @Operation(summary = "删除通知模板")
    @DeleteMapping("/admin/notification-templates/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        templateService.delete(id);
        return ApiResponse.ok(null);
    }
}
