package com.taoke.course.controller.interaction;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.response.PageResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.interaction.FavoriteRequest;
import com.taoke.course.dto.interaction.FavoriteVO;
import com.taoke.course.service.interaction.FavoriteServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 收藏接口 — 需登录
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Tag(name = "收藏", description = "通用收藏增删查")
@RestController
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteServiceImpl favoriteService;

    @Operation(summary = "添加收藏")
    @PostMapping("/interaction/favorites")
    public ApiResponse<Void> addFavorite(@Valid @RequestBody FavoriteRequest request) {
        Integer userId = SecurityUtils.getRequiredUserId();
        favoriteService.addFavorite(userId, request.getTargetType(), request.getTargetId());
        return ApiResponse.ok();
    }

    @Operation(summary = "取消收藏")
    @DeleteMapping("/interaction/favorites")
    public ApiResponse<Void> removeFavorite(
            @RequestParam String targetType,
            @RequestParam Integer targetId) {
        Integer userId = SecurityUtils.getRequiredUserId();
        favoriteService.removeFavorite(userId, targetType, targetId);
        return ApiResponse.ok();
    }

    @Operation(summary = "我的收藏分页")
    @GetMapping("/interaction/favorites")
    public ApiResponse<PageResponse<FavoriteVO>> listFavorites(
            @RequestParam(required = false) String targetType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(favoriteService.listFavorites(userId, targetType, page, size));
    }

    @Operation(summary = "检查是否已收藏")
    @GetMapping("/interaction/favorites/check")
    public ApiResponse<Boolean> checkFavorite(
            @RequestParam String targetType,
            @RequestParam Integer targetId) {
        Integer userId = SecurityUtils.getRequiredUserId();
        return ApiResponse.ok(favoriteService.isFavorited(userId, targetType, targetId));
    }
}
