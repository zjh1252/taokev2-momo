package com.taoke.admin.controller;

import com.taoke.admin.dto.BroadcastNotificationRequest;
import com.taoke.admin.dto.SendNotificationRequest;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.enums.NotificationType;
import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.user.api.NotificationService;
import com.taoke.user.api.NotificationTemplateService;
import com.taoke.user.api.UserRoleService;
import com.taoke.user.api.UserService;
import com.taoke.user.dto.notification.RenderedTemplate;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 后台 — 通知管理（广播 + 灵活发送）。
 * <p>
 * 通过 {@code api/} 契约接口访问 taoke-user 能力，不直接依赖 Repository。
 *
 * @author Fangxinxin
 * @date 2026-04-02 14:00
 */
@Tag(name = "后台-通知管理")
@RestController
@RequireRole(BusinessRole.Code.SUPER_ADMIN)
@RequiredArgsConstructor
public class AdminNotificationController {

    private final NotificationService notificationService;
    private final NotificationTemplateService templateService;
    private final UserService userService;
    private final UserRoleService userRoleService;

    @Operation(summary = "广播系统公告（给所有正常状态用户）")
    @PostMapping("/admin/notifications/broadcast")
    public ApiResponse<Integer> broadcast(@Valid @RequestBody BroadcastNotificationRequest request) {
        List<Integer> activeUserIds = userService.getActiveUserIds();

        if (activeUserIds.isEmpty()) {
            return ApiResponse.ok(0);
        }

        notificationService.sendBatch(activeUserIds, NotificationType.SYSTEM,
                request.getTitle(), request.getContent(), request.getRelatedUrl());

        return ApiResponse.ok(activeUserIds.size());
    }

    @Operation(summary = "发送通知（支持全员/按角色/指定用户）")
    @PostMapping("/admin/notifications/send")
    public ApiResponse<Integer> send(@Valid @RequestBody SendNotificationRequest request) {
        String title = request.getTitle();
        String content = request.getContent();
        if (request.getTemplateCode() != null && !request.getTemplateCode().isBlank()) {
            RenderedTemplate rendered = templateService.renderTemplate(
                    request.getTemplateCode(),
                    request.getTemplateVariables() != null ? request.getTemplateVariables() : Map.of());
            title = rendered.getTitle();
            content = rendered.getContent();
        }
        if (title == null || title.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "通知标题不能为空");
        }
        if (content == null || content.isBlank()) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "通知内容不能为空");
        }

        List<Integer> targetUserIds = resolveTargetUserIds(request);
        if (targetUserIds.isEmpty()) {
            return ApiResponse.ok(0);
        }

        NotificationType notifType = NotificationType.SYSTEM;
        if (request.getType() != null && !request.getType().isBlank()) {
            try {
                notifType = NotificationType.valueOf(request.getType());
            } catch (IllegalArgumentException ignored) {
            }
        }

        notificationService.sendBatch(targetUserIds, notifType, title, content, request.getRelatedUrl());
        return ApiResponse.ok(targetUserIds.size());
    }

    /** 根据 targetType 解析目标用户 ID 列表 */
    private List<Integer> resolveTargetUserIds(SendNotificationRequest request) {
        return switch (request.getTargetType()) {
            case ALL -> userService.getActiveUserIds();
            case ROLE -> {
                if (request.getRoleCodes() == null || request.getRoleCodes().isEmpty()) {
                    throw new BusinessException(ErrorCode.PARAM_INVALID, "按角色发送时 roleCodes 不能为空");
                }
                Set<Integer> userIds = new LinkedHashSet<>();
                for (String roleCode : request.getRoleCodes()) {
                    userIds.addAll(userRoleService.getUserIdsByRoleAndStatus(roleCode, 1));
                }
                yield List.copyOf(userIds);
            }
            case USERS -> {
                if (request.getUserIds() == null || request.getUserIds().isEmpty()) {
                    throw new BusinessException(ErrorCode.PARAM_INVALID, "指定用户发送时 userIds 不能为空");
                }
                yield request.getUserIds().stream().distinct().collect(Collectors.toList());
            }
        };
    }
}
