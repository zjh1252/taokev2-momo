package com.taoke.course.repository.interaction;

import com.taoke.course.entity.interaction.UserFavorite;
import com.taoke.course.enums.InteractionTargetType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 用户收藏持久化
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Integer> {

    Optional<UserFavorite> findByUserIdAndTargetTypeAndTargetId(Integer userId, InteractionTargetType targetType, Integer targetId);

    boolean existsByUserIdAndTargetTypeAndTargetId(Integer userId, InteractionTargetType targetType, Integer targetId);

    void deleteByUserIdAndTargetTypeAndTargetId(Integer userId, InteractionTargetType targetType, Integer targetId);

    Page<UserFavorite> findByUserIdAndTargetTypeOrderByCreatedAtDesc(Integer userId, InteractionTargetType targetType, Pageable pageable);

    Page<UserFavorite> findByUserIdOrderByCreatedAtDesc(Integer userId, Pageable pageable);

    long countByTargetTypeAndTargetId(InteractionTargetType targetType, Integer targetId);
}
