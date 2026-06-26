package com.taoke.course.repository.interaction;

import com.taoke.course.entity.interaction.UserLike;
import com.taoke.course.enums.InteractionTargetType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 用户点赞持久化
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
public interface UserLikeRepository extends JpaRepository<UserLike, Integer> {

    Optional<UserLike> findByUserIdAndTargetTypeAndTargetId(Integer userId, InteractionTargetType targetType, Integer targetId);

    boolean existsByUserIdAndTargetTypeAndTargetId(Integer userId, InteractionTargetType targetType, Integer targetId);

    void deleteByUserIdAndTargetTypeAndTargetId(Integer userId, InteractionTargetType targetType, Integer targetId);

    long countByTargetTypeAndTargetId(InteractionTargetType targetType, Integer targetId);
}
