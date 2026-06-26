package com.taoke.course.service.interaction;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.common.response.PageResponse;
import com.taoke.course.dto.interaction.FavoriteVO;
import com.taoke.course.entity.interaction.UserFavorite;
import com.taoke.course.entity.video.Video;
import com.taoke.course.entity.video.VideoEnrollment;
import com.taoke.course.enums.InteractionTargetType;
import com.taoke.course.repository.interaction.UserFavoriteRepository;
import com.taoke.course.repository.video.VideoEnrollmentRepository;
import com.taoke.course.repository.video.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    private final VideoRepository videoRepository;
    private final VideoEnrollmentRepository videoEnrollmentRepository;

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

        List<FavoriteVO> voList = favPage.getContent().stream().map(fav -> {
            FavoriteVO vo = new FavoriteVO();
            vo.setId(fav.getId());
            vo.setTargetType(fav.getTargetType().name());
            vo.setTargetId(fav.getTargetId());
            vo.setCreatedAt(fav.getCreatedAt());
            // 回填资源快照信息
            targetValidator.fillFavoriteSnapshot(vo, fav.getTargetType(), fav.getTargetId());
            return vo;
        }).toList();

        enrichVideoUnlockedStatus(voList, userId);

        return PageResponse.of(voList, favPage.getTotalElements(), page, size);
    }

    /**
     * 批量标记收藏列表中录播课的解锁状态（与录播课列表 unlocked 语义一致）
     */
    private void enrichVideoUnlockedStatus(List<FavoriteVO> items, Integer userId) {
        if (userId == null || items.isEmpty()) {
            return;
        }

        List<Integer> videoIds = items.stream()
                .filter(vo -> InteractionTargetType.VIDEO.name().equals(vo.getTargetType()))
                .map(FavoriteVO::getTargetId)
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
        if (videoIds.isEmpty()) {
            return;
        }

        Map<Integer, Video> videoMap = videoRepository.findAllById(videoIds).stream()
                .collect(Collectors.toMap(Video::getId, Function.identity()));

        Set<Integer> enrolledIds = videoEnrollmentRepository
                .findByUserIdAndVideoIdIn(userId, videoIds)
                .stream()
                .filter(this::isActiveEnrollment)
                .map(VideoEnrollment::getVideoId)
                .collect(Collectors.toSet());

        for (FavoriteVO vo : items) {
            if (!InteractionTargetType.VIDEO.name().equals(vo.getTargetType())) {
                continue;
            }
            Video video = videoMap.get(vo.getTargetId());
            if (video == null) {
                vo.setUnlocked(false);
                continue;
            }
            boolean unlocked = userId.equals(video.getPublisherId())
                    || (video.getIsFree() != null && video.getIsFree() == 1)
                    || enrolledIds.contains(video.getId());
            vo.setUnlocked(unlocked);
        }
    }

    private boolean isActiveEnrollment(VideoEnrollment enrollment) {
        if (enrollment.getStatus() == null || enrollment.getStatus() != 1) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        return enrollment.getExpiredAt() == null || enrollment.getExpiredAt().isAfter(now);
    }

    public long countFavorites(String targetTypeStr, Integer targetId) {
        InteractionTargetType targetType = InteractionTargetType.valueOf(targetTypeStr);
        return favoriteRepository.countByTargetTypeAndTargetId(targetType, targetId);
    }
}
