package com.taoke.course.service.cms;

import com.taoke.course.api.CourseService;
import com.taoke.course.api.PublicRecommendationService;
import com.taoke.course.dto.cms.PublicRecommendedItemVO;
import com.taoke.course.dto.cms.RecommendedResourceItemVO;
import com.taoke.course.dto.course.CourseListItemVO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.cms.RecommendedResource;
import com.taoke.course.repository.RecommendedResourceRepository;
import com.taoke.user.api.TrainerCaseService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.dto.trainercase.TrainerCaseResponse;
import com.taoke.user.entity.Trainer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * C 端公开推荐位查询实现
 *
 * @author Fangxinxin
 * @date 2026-06-12 20:00
 */
@Service
@RequiredArgsConstructor
public class PublicRecommendationServiceImpl implements PublicRecommendationService {

    private static final String ROLE_PRIMARY = "PRIMARY";

    /** 专家已上架 */
    private static final int TRAINER_PUBLISHED = 2;
    /** 案例已通过 */
    private static final int CASE_APPROVED = 1;
    /** 课程已上架 */
    private static final int COURSE_PUBLISHED = 2;
    /** 机构已发布 */
    private static final int INSTITUTION_PUBLISHED = 1;

    private final RecommendedResourceRepository recommendedResourceRepository;
    private final RecommendedResourceEnricher enricher;
    private final CourseService courseService;
    private final TrainerCaseService trainerCaseService;
    private final TrainerService trainerService;

    @Override
    @Transactional(readOnly = true)
    public List<PublicRecommendedItemVO> listPublic(
            String slotCode, Integer categoryId, int limit, boolean includeBackup) {
        List<RecommendedResource> rows = categoryId != null
                ? recommendedResourceRepository.findBySlotCodeAndCategoryIdOrderBySortOrderDescIdDesc(
                        slotCode, categoryId)
                : recommendedResourceRepository.findBySlotCodeAndCategoryIdIsNullOrderBySortOrderDescIdDesc(
                        slotCode);

        if (rows.isEmpty()) {
            return List.of();
        }

        List<RecommendedResource> filtered = rows.stream()
                .filter(row -> includeBackup || ROLE_PRIMARY.equals(row.getRoleType()))
                .toList();

        List<RecommendedResourceItemVO> enriched = enricher.enrich(slotCode, filtered);
        Map<Integer, CourseListItemVO> courseById = loadCourseListItems(enriched);
        Map<Integer, TrainerCaseResponse> caseById = loadCaseDetails(enriched);
        Map<Integer, Trainer> trainerById = loadTrainersForCases(caseById.values());

        return enriched.stream()
                .filter(this::isPublished)
                .map(item -> toPublicVO(item, courseById, caseById, trainerById))
                .limit(limit > 0 ? limit : Integer.MAX_VALUE)
                .toList();
    }

    private Map<Integer, CourseListItemVO> loadCourseListItems(List<RecommendedResourceItemVO> items) {
        Set<Integer> ids = items.stream()
                .filter(item -> "COURSE".equals(item.getResourceType()))
                .map(RecommendedResourceItemVO::getResourceId)
                .collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Map.of();
        }
        List<Course> courses = courseService.findByIds(ids);
        return courseService.assembleListItems(courses).stream()
                .collect(Collectors.toMap(CourseListItemVO::getId, item -> item, (a, b) -> a));
    }

    private Map<Integer, TrainerCaseResponse> loadCaseDetails(List<RecommendedResourceItemVO> items) {
        Map<Integer, TrainerCaseResponse> map = new HashMap<>();
        for (RecommendedResourceItemVO item : items) {
            if (!"CASE".equals(item.getResourceType())) {
                continue;
            }
            try {
                map.put(item.getResourceId(), trainerCaseService.adminGetDetail(item.getResourceId()));
            } catch (Exception ignored) {
                // 案例可能已删除
            }
        }
        return map;
    }

    private Map<Integer, Trainer> loadTrainersForCases(Collection<TrainerCaseResponse> cases) {
        Set<Integer> trainerIds = cases.stream()
                .map(TrainerCaseResponse::getTrainerId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (trainerIds.isEmpty()) {
            return Map.of();
        }
        return trainerService.findByIds(trainerIds).stream()
                .collect(Collectors.toMap(Trainer::getId, trainer -> trainer, (a, b) -> a));
    }

    private boolean isPublished(RecommendedResourceItemVO item) {
        Integer status = item.getResourceStatus();
        if (status == null) {
            return false;
        }
        return switch (item.getResourceType()) {
            case "TRAINER" -> Objects.equals(status, TRAINER_PUBLISHED);
            case "CASE" -> Objects.equals(status, CASE_APPROVED);
            case "COURSE" -> Objects.equals(status, COURSE_PUBLISHED);
            case "INSTITUTION" -> Objects.equals(status, INSTITUTION_PUBLISHED);
            default -> false;
        };
    }

    private PublicRecommendedItemVO toPublicVO(
            RecommendedResourceItemVO item,
            Map<Integer, CourseListItemVO> courseById,
            Map<Integer, TrainerCaseResponse> caseById,
            Map<Integer, Trainer> trainerById) {

        PublicRecommendedItemVO vo = new PublicRecommendedItemVO();
        vo.setResourceId(item.getResourceId());
        vo.setResourceType(item.getResourceType());
        vo.setRoleType(item.getRoleType());
        vo.setSortOrder(item.getSortOrder());
        vo.setCoverUrl(item.getCoverUrl());
        vo.setTitle(item.getTitle());
        vo.setDescription(item.getDescription());
        vo.setExpertiseOverride(item.getExpertiseOverride());
        vo.setKeyTags(item.getKeyTags());
        vo.setResourceName(item.getResourceName());
        vo.setResourceCoverUrl(item.getResourceCoverUrl());
        vo.setResourceDescription(item.getResourceDescription());
        vo.setResourceMeta(item.getResourceMeta());

        switch (item.getResourceType()) {
            case "TRAINER" -> {
                vo.setTeachingName(item.getResourceName());
                vo.setAvatar(item.getResourceCoverUrl());
                vo.setOneLineIntro(item.getResourceDescription());
                vo.setExpertiseTags(
                        item.getExpertiseOverride() != null && !item.getExpertiseOverride().isBlank()
                                ? item.getExpertiseOverride() : item.getResourceMeta());
            }
            case "COURSE" -> {
                CourseListItemVO course = courseById.get(item.getResourceId());
                vo.setCourseType(item.getResourceMeta());
                vo.setCourseSummary(item.getResourceDescription());
                if (course != null) {
                    vo.setTrainerName(course.getTrainerName());
                    vo.setDurationDays(course.getDurationDays());
                    if (course.getNextPlanStartDate() != null) {
                        vo.setNextPlanStartDate(course.getNextPlanStartDate().toString());
                    }
                    vo.setNextPlanCity(course.getNextPlanCity());
                    vo.setPublisherName(course.getPublisherName());
                    if (course.getCategoryName() != null) {
                        vo.setResourceMeta(course.getCategoryName());
                    }
                }
            }
            case "CASE" -> {
                TrainerCaseResponse caseItem = caseById.get(item.getResourceId());
                vo.setCaseTitle(item.getResourceName());
                vo.setIndustry(item.getResourceMeta());
                if (caseItem != null) {
                    vo.setTrainerId(caseItem.getTrainerId());
                    if (caseItem.getTrainingDate() != null) {
                        vo.setTrainingDate(caseItem.getTrainingDate().toString());
                    }
                    vo.setDescription(
                            item.getDescription() != null && !item.getDescription().isBlank()
                                    ? item.getDescription() : caseItem.getDescription());
                    Trainer trainer = trainerById.get(caseItem.getTrainerId());
                    if (trainer != null) {
                        vo.setTrainerNameForCase(trainer.getTeachingName() != null
                                && !trainer.getTeachingName().isBlank()
                                ? trainer.getTeachingName() : trainer.getName());
                        vo.setTrainerAvatar(trainer.getAvatar());
                    }
                }
            }
            case "INSTITUTION" -> {
                vo.setOrgName(item.getResourceName());
                vo.setLogoUrl(item.getResourceCoverUrl());
            }
            default -> { }
        }
        return vo;
    }
}
