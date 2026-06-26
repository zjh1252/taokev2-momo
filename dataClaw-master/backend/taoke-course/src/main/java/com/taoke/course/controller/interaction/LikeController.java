package com.taoke.course.controller.interaction;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.interaction.LikeRequest;
import com.taoke.course.service.interaction.LikeServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 点赞接口 — 需登录
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Tag(name = "点赞", description = "通用点赞增删查")
@RestController
@RequiredArgsConstructor
public class LikeController {

    private final LikeServiceImpl likeService;

    @Operation(summary = "点赞")
    @PostMapping("/interaction/likes")
    public ApiResponse<Void> addLike(@Valid @RequestBody LikeRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        likeService.addLike(userId, request.getTargetType(), request.getTargetId());
        return ApiResponse.ok();
    }

    @Operation(summary = "取消点赞")
    @DeleteMapping("/interaction/likes")
    public ApiResponse<Void> removeLike(
            @RequestParam String targetType,
            @RequestParam Integer targetId) {
        Integer userId = SecurityUtils.getRequiredUserId();
        likeService.removeLike(userId, targetType, targetId);
        return ApiResponse.ok();
    }

    @Operation(summary = "检查是否已点赞")
    @GetMapping("/interaction/likes/check")
    public ApiResponse<Boolean> checkLike(
            @RequestParam String targetType,
            @RequestParam Integer targetId) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(likeService.isLiked(userId, targetType, targetId));
    }
}
