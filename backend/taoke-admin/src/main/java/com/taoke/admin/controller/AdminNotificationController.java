package com.taoke.admin.controller;

import com.taoke.admin.dto.BroadcastNotificationRequest;
import com.taoke.common.enums.BusinessRole;
import com.taoke.common.enums.NotificationType;
import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.RequireRole;
import com.taoke.user.api.NotificationService;
import com.taoke.user.entity.User;
import com.taoke.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 后台 — 通知管理（系统公告广播）。
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
    private final UserRepository userRepository;

    @Operation(summary = "广播系统公告（给所有正常状态用户）")
    @PostMapping("/admin/notifications/broadcast")
    public ApiResponse<Integer> broadcast(@Valid @RequestBody BroadcastNotificationRequest request) {
        List<Integer> activeUserIds = userRepository.findByStatus(1)
                .stream()
                .map(User::getId)
                .toList();

        if (activeUserIds.isEmpty()) {
            return ApiResponse.ok(0);
        }

        notificationService.sendBatch(activeUserIds, NotificationType.SYSTEM,
                request.getTitle(), request.getContent(), request.getRelatedUrl());

        return ApiResponse.ok(activeUserIds.size());
    }
}
