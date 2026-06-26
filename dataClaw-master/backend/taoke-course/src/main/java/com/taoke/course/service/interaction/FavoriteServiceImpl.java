package com.taoke.course.service.interaction;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.interaction.FavoriteVO;
import com.taoke.course.entity.interaction.UserFavorite;
import com.taoke.course.enums.InteractionTargetType;
import com.taoke.course.repository.interaction.UserFavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 收藏业务实现
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl {

    private final UserFavoriteRepository favoriteRepository;
    private final InteractionTargetValidator targetValidator;

    @Transactional
    public void addFavorite(Integer userId, String targetTypeStr, Integer targetId) {
        InteractionTargetType targetType = InteractionTargetType.valueOf(targetTypeStr);
        targetValidator.validateTargetExists(targetType, targetId);

        if (favoriteRepository.existsByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId)) {
            throw new BusinessException(ErrorCode.FAVORITE_ALREADY_EXISTS);
        }

        UserFavorite fav = new UserFavorite();
        fav.setUserId(userId);
        fav.setTargetType(targetType);
        fav.setTargetId(targetId);
        favoriteRepository.save(fav);
    }

    @Transactional
    public void removeFavorite(Integer userId, String targetTypeStr, Integer targetId) {
        InteractionTargetType targetType = InteractionTargetType.valueOf(targetTypeStr);
        if (!favoriteRepository.existsByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId)) {
            throw new BusinessException(ErrorCode.FAVORITE_NOT_FOUND);
        }
        favoriteRepository.deleteByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId);
    }

    public boolean isFavorited(Integer userId, String targetTypeStr, Integer targetId) {
        InteractionTargetType targetType = InteractionTargetType.valueOf(targetTypeStr);
        return favoriteRepository.existsByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId);
    }

    /**
     * 我的收藏分页
     */
    public PageResponse<FavoriteVO> listFavorites(Integer userId, String targetTypeStr, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<UserFavorite> favPage;
        if (targetTypeStr != null && !targetTypeStr.isBlank()) {
            InteractionTargetType targetType = InteractionTargetType.valueOf(targetTypeStr);
            favPage = favoriteRepository.findByUserIdAndTargetTypeOrderByCreatedAtDesc(userId, targetType, pageable);
        } else {
            favPage = favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        Page<FavoriteVO> voPage = favPage.map(fav -> {
            FavoriteVO vo = new FavoriteVO();
            vo.setId(fav.getId());
            vo.setTargetType(fav.getTargetType().name());
            vo.setTargetId(fav.getTargetId());
            vo.setCreatedAt(fav.getCreatedAt());
            // 回填资源快照信息
            targetValidator.fillFavoriteSnapshot(vo, fav.getTargetType(), fav.getTargetId());
            return vo;
        });

        return PageResponse.of(voPage);
    }

    public long countFavorites(String targetTypeStr, Integer targetId) {
        InteractionTargetType targetType = InteractionTargetType.valueOf(targetTypeStr);
        return favoriteRepository.countByTargetTypeAndTargetId(targetType, targetId);
    }
}
