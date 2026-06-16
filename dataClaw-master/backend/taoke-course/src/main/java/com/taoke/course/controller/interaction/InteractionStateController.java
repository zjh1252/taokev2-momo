package com.taoke.course.controller.interaction;

import com.taoke.common.response.ApiResponse;
import com.taoke.common.security.SecurityUtils;
import com.taoke.course.dto.interaction.InteractionStateVO;
import com.taoke.course.service.interaction.FavoriteServiceImpl;
import com.taoke.course.service.interaction.LikeServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 互动聚合状态接口 — 一次返回收藏+点赞状态
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Tag(name = "互动状态", description = "查询当前用户对资源的互动状态")
@RestController
@RequiredArgsConstructor
public class InteractionStateController {

    private final FavoriteServiceImpl favoriteService;
    private final LikeServiceImpl likeService;

    @Operation(summary = "查询互动状态（收藏+点赞）")
    @GetMapping("/interaction/states")
    public ApiResponse<InteractionStateVO> getStates(
            @RequestParam String targetType,
            @RequestParam Integer targetId) {
        Integer userId = SecurityUtils.getRequiredUserId();

        InteractionStateVO vo = new InteractionStateVO();
        vo.setTargetType(targetType);
        vo.setTargetId(targetId);
        vo.setFavorited(favoriteService.isFavorited(userId, targetType, targetId));
        vo.setLiked(likeService.isLiked(userId, targetType, targetId));
        vo.setFavoriteCount(favoriteService.countFavorites(targetType, targetId));
        vo.setLikeCount(likeService.countLikes(targetType, targetId));

        return ApiResponse.ok(vo);
    }
}
