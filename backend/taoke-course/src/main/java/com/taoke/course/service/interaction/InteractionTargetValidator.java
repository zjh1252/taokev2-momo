package com.taoke.course.service.interaction;

import com.taoke.common.exception.BusinessException;
import com.taoke.common.exception.ErrorCode;
import com.taoke.course.dto.interaction.FavoriteVO;
import com.taoke.course.entity.Course;
import com.taoke.course.enums.InteractionTargetType;
import com.taoke.course.entity.video.Video;
import com.taoke.course.repository.CourseRepository;
import com.taoke.course.repository.video.VideoRepository;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerCaseService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.dto.trainer.TrainerResponse;
import com.taoke.user.dto.trainercase.TrainerCaseResponse;
import com.taoke.user.entity.Institution;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
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
    private final VideoRepository videoRepository;
    private final TrainerService trainerService;
    private final InstitutionService institutionService;
    private final TrainerCaseService trainerCaseService;

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
            case VIDEO -> {
                if (!videoRepository.existsById(targetId)) {
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
            case INSTITUTION -> {
                List<Institution> insts = institutionService.findByIds(List.of(targetId));
                if (insts.isEmpty()) {
                    throw new BusinessException(ErrorCode.INTERACTION_TARGET_NOT_FOUND);
                }
            }
            case CASE -> {
                try {
                    trainerCaseService.getApprovedCaseDetail(targetId);
                } catch (Exception e) {
                    throw new BusinessException(ErrorCode.INTERACTION_TARGET_NOT_FOUND);
                }
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
                    // 按课程类型区分公开课/内训课详情页
                    vo.setLinkUrl(c.getType() != null && c.getType().isOpen()
                            ? "/opencourses/" + targetId
                            : "/innercourses/" + targetId);
                }
            }
            case VIDEO -> {
                Optional<Video> opt = videoRepository.findById(targetId);
                if (opt.isPresent()) {
                    Video v = opt.get();
                    vo.setTitle(v.getTitle());
                    vo.setSubtitle(v.getTeacherName() != null ? v.getTeacherName() : "录播课");
                    vo.setCoverUrl(v.getCoverUrl());
                    vo.setLinkUrl("/videos/" + targetId);
                }
            }
            case TRAINER -> {
                try {
                    TrainerResponse trainer = trainerService.getByUserId(targetId);
                    if (trainer != null) {
                        vo.setTitle(trainer.getName());
                        vo.setSubtitle(trainer.getTitle());
                        vo.setCoverUrl(trainer.getAvatar());
                        // 专家详情页按 trainer 档案 ID 路由（收藏存的是 userId）
                        vo.setLinkUrl("/trainers/" + trainer.getId());
                    }
                } catch (Exception ignored) {
                }
            }
            case INSTITUTION -> {
                List<Institution> insts = institutionService.findByIds(List.of(targetId));
                if (!insts.isEmpty()) {
                    Institution inst = insts.get(0);
                    vo.setTitle(inst.getOrgName());
                    vo.setSubtitle(inst.getSpecialties());
                    vo.setCoverUrl(inst.getLogoUrl());
                    vo.setLinkUrl("/institutions/" + targetId);
                }
            }
            case CASE -> {
                try {
                    TrainerCaseResponse c = trainerCaseService.getApprovedCaseDetail(targetId);
                    if (c != null) {
                        vo.setTitle(c.getCaseTitle());
                        vo.setSubtitle(c.getTrainerName());
                        vo.setCoverUrl(c.getCoverImage());
                        vo.setLinkUrl("/cases/" + targetId);
                    }
                } catch (Exception ignored) {
                }
            }
        }
    }
}
