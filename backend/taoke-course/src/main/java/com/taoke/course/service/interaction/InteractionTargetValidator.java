package com.taoke.course.service.interaction;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.dto.interaction.FavoriteVO;
import com.taoke.course.entity.Course;
import com.taoke.course.enums.InteractionTargetType;
import com.taoke.course.repository.CourseRepository;
import com.taoke.user.api.TrainerService;
import com.taoke.user.dto.trainer.TrainerResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * 互动目标资源校验器 — 校验收藏/点赞/评价等目标是否存在
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Component
@RequiredArgsConstructor
public class InteractionTargetValidator {

    private final CourseRepository courseRepository;
    private final TrainerService trainerService;

    /**
     * 校验目标资源是否存在
     */
    public void validateTargetExists(InteractionTargetType targetType, Integer targetId) {
        switch (targetType) {
            case COURSE -> {
                if (!courseRepository.existsById(targetId)) {
                    throw new BusinessException(ErrorCode.INTERACTION_TARGET_NOT_FOUND);
                }
            }
            case TRAINER -> {
                try {
                    trainerService.getByUserId(targetId);
                } catch (Exception e) {
                    throw new BusinessException(ErrorCode.INTERACTION_TARGET_NOT_FOUND);
                }
            }
            case INSTITUTION, CASE -> {
                // TODO: 待机构/案例模块完善后补充校验逻辑
            }
        }
    }

    /**
     * 回填收藏列表的资源快照信息
     */
    public void fillFavoriteSnapshot(FavoriteVO vo, InteractionTargetType targetType, Integer targetId) {
        switch (targetType) {
            case COURSE -> {
                Optional<Course> opt = courseRepository.findById(targetId);
                if (opt.isPresent()) {
                    Course c = opt.get();
                    vo.setTitle(c.getTitle());
                    vo.setSubtitle(c.getType() != null ? c.getType().getLabel() : "");
                    vo.setCoverUrl(c.getCoverUrl());
                }
            }
            case TRAINER -> {
                try {
                    TrainerResponse trainer = trainerService.getByUserId(targetId);
                    if (trainer != null) {
                        vo.setTitle(trainer.getName());
                        vo.setSubtitle(trainer.getTitle());
                        vo.setCoverUrl(trainer.getAvatar());
                    }
                } catch (Exception ignored) {
                }
            }
            case INSTITUTION, CASE -> {
                // TODO: 待对应模块完善后补充
            }
        }
    }
}
