package com.taoke.course.service.interaction;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.entity.interaction.UserLike;
import com.taoke.course.enums.InteractionTargetType;
import com.taoke.course.repository.interaction.UserLikeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 点赞业务实现
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Service
@RequiredArgsConstructor
public class LikeServiceImpl {

    private final UserLikeRepository likeRepository;
    private final InteractionTargetValidator targetValidator;

    @Transactional
    public void addLike(Integer userId, String targetTypeStr, Integer targetId) {
        InteractionTargetType targetType = InteractionTargetType.valueOf(targetTypeStr);
        targetValidator.validateTargetExists(targetType, targetId);

        if (likeRepository.existsByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId)) {
            throw new BusinessException(ErrorCode.LIKE_ALREADY_EXISTS);
        }

        UserLike like = new UserLike();
        like.setUserId(userId);
        like.setTargetType(targetType);
        like.setTargetId(targetId);
        likeRepository.save(like);
    }

    @Transactional
    public void removeLike(Integer userId, String targetTypeStr, Integer targetId) {
        InteractionTargetType targetType = InteractionTargetType.valueOf(targetTypeStr);
        if (!likeRepository.existsByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId)) {
            throw new BusinessException(ErrorCode.LIKE_NOT_FOUND);
        }
        likeRepository.deleteByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId);
    }

    public boolean isLiked(Integer userId, String targetTypeStr, Integer targetId) {
        InteractionTargetType targetType = InteractionTargetType.valueOf(targetTypeStr);
        return likeRepository.existsByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId);
    }

    public long countLikes(String targetTypeStr, Integer targetId) {
        InteractionTargetType targetType = InteractionTargetType.valueOf(targetTypeStr);
        return likeRepository.countByTargetTypeAndTargetId(targetType, targetId);
    }
}
