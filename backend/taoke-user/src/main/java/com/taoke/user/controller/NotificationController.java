package com.taoke.user.controller;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.user.api.NotificationService;
import com.taoke.user.dto.notification.NotificationVO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 站内信通知 — C端用户接口。
 *
 * @author Fangxinxin
 * @date 2026-04-02 14:00
 */
@Tag(name = "站内信", description = "用户站内消息通知")
@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "分页查询我的通知")
    @GetMapping("/notifications")
    public ApiResponse<PageResponse<NotificationVO>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(notificationService.listByUser(userId, page, size));
    }

    @Operation(summary = "获取未读通知数")
    @GetMapping("/notifications/unread-count")
    public ApiResponse<Long> unreadCount() {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(notificationService.countUnread(userId));
    }

    @Operation(summary = "标记单条通知为已读")
    @PutMapping("/notifications/{id}/read")
    public ApiResponse<Void> markRead(@PathVariable Integer id) {
        Integer userId = SecurityUtils.getRequiredUserId();
        notificationService.markRead(userId, id);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "标记全部通知为已读")
    @PutMapping("/notifications/read-all")
    public ApiResponse<Void> markAllRead() {
        Integer userId = SecurityUtils.getRequiredUserId();
        notificationService.markAllRead(userId);
        return ApiResponse.ok(null);
    }
}
