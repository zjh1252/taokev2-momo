package com.taoke.course.service.interaction;

import com.taoke.course.api.InteractionQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 互动数据查询接口实现 — 委托到 FavoriteServiceImpl / ReviewServiceImpl
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Service
@RequiredArgsConstructor
public class InteractionQueryServiceImpl implements InteractionQueryService {

    private final FavoriteServiceImpl favoriteService;
    private final ReviewServiceImpl reviewService;

    @Override
    public long countFavorites(String targetType, int targetId) {
        return favoriteService.countFavorites(targetType, targetId);
    }

    @Override
    public long countApprovedReviews(String scope, int targetId) {
        return reviewService.countApprovedReviews(scope, targetId);
    }

    @Override
    public boolean isFavorited(int userId, String targetType, int targetId) {
        return favoriteService.isFavorited(userId, targetType, targetId);
    }
}
