package com.taoke.course.service.cms;

import com.taoke.common.exception.BusinessException;
import com.taoke.course.dto.cms.RecommendedResourceItemVO;
import com.taoke.course.entity.Course;
import com.taoke.course.entity.cms.RecommendedResource;
import com.taoke.course.enums.RecommendationSlot;
import com.taoke.course.repository.CourseRepository;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerCaseService;
import com.taoke.user.api.TrainerService;
import com.taoke.user.dto.trainercase.TrainerCaseResponse;
import com.taoke.user.entity.Institution;
import com.taoke.user.entity.Trainer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 推荐资源位批量回表与 VO 填充
 *
 * @author Fangxinxin
 * @date 2026-06-12 20:00
 */
@Component
@RequiredArgsConstructor
public class RecommendedResourceEnricher {

    private final CourseRepository courseRepository;
    private final TrainerService trainerService;
    private final InstitutionService institutionService;
    private final TrainerCaseService trainerCaseService;

    public List<RecommendedResourceItemVO> enrich(String slotCode, List<RecommendedResource> rows) {
        if (rows.isEmpty()) {
            return List.of();
        }
        RecommendationSlot slot = RecommendationSlot.fromCode(slotCode);
        Map<Integer, Trainer> trainerMap = loadTrainers(rows, slot.getResourceType());
        Map<Integer, Course> courseMap = loadCourses(rows, slot.getResourceType());
        Map<Integer, Institution> institutionMap = loadInstitutions(rows, slot.getResourceType());
        Map<Integer, TrainerCaseResponse> caseMap = loadCases(rows, slot.getResourceType());

        return rows.stream()
                .map(row -> toAdminItemVO(row, trainerMap, courseMap, institutionMap, caseMap))
                .toList();
    }

    private Map<Integer, Trainer> loadTrainers(List<RecommendedResource> rows, String expectedType) {
        if (!"TRAINER".equals(expectedType)) {
            return Map.of();
        }
        Set<Integer> ids = rows.stream().map(RecommendedResource::getResourceId).collect(Collectors.toSet());
        return trainerService.findByIds(ids).stream()
                .collect(Collectors.toMap(Trainer::getId, Function.identity()));
    }

    private Map<Integer, Course> loadCourses(List<RecommendedResource> rows, String expectedType) {
        if (!"COURSE".equals(expectedType)) {
            return Map.of();
        }
        Set<Integer> ids = rows.stream().map(RecommendedResource::getResourceId).collect(Collectors.toSet());
        return courseRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Course::getId, Function.identity()));
    }

    private Map<Integer, Institution> loadInstitutions(List<RecommendedResource> rows, String expectedType) {
        if (!"INSTITUTION".equals(expectedType)) {
            return Map.of();
        }
        Set<Integer> ids = rows.stream().map(RecommendedResource::getResourceId).collect(Collectors.toSet());
        return institutionService.findByIds(ids).stream()
                .collect(Collectors.toMap(Institution::getId, Function.identity()));
    }

    private Map<Integer, TrainerCaseResponse> loadCases(List<RecommendedResource> rows, String expectedType) {
        if (!"CASE".equals(expectedType)) {
            return Map.of();
        }
        Map<Integer, TrainerCaseResponse> map = new HashMap<>();
        for (RecommendedResource row : rows) {
            try {
                map.put(row.getResourceId(), trainerCaseService.adminGetDetail(row.getResourceId()));
            } catch (BusinessException ignored) {
                // 案例可能已删除
            }
        }
        return map;
    }

    RecommendedResourceItemVO toAdminItemVO(
            RecommendedResource row,
            Map<Integer, Trainer> trainerMap,
            Map<Integer, Course> courseMap,
            Map<Integer, Institution> institutionMap,
            Map<Integer, TrainerCaseResponse> caseMap) {

        RecommendedResourceItemVO vo = new RecommendedResourceItemVO();
        vo.setId(row.getId());
        vo.setSlotCode(row.getSlotCode());
        vo.setResourceType(row.getResourceType());
        vo.setResourceId(row.getResourceId());
        vo.setCategoryId(row.getCategoryId());
        vo.setRoleType(row.getRoleType());
        vo.setSortOrder(row.getSortOrder());
        vo.setCoverUrl(row.getCoverUrl());
        vo.setTitle(row.getTitle());
        vo.setDescription(row.getDescription());
        vo.setChiefIntro(row.getChiefIntro());
        vo.setExpertiseOverride(row.getExpertiseOverride());
        vo.setKeyTags(row.getKeyTags());
        vo.setAdminNote(row.getAdminNote());
        vo.setCreatedAt(row.getCreatedAt());

        switch (row.getResourceType()) {
            case "TRAINER" -> applyTrainerMeta(vo, trainerMap.get(row.getResourceId()));
            case "COURSE" -> applyCourseMeta(vo, courseMap.get(row.getResourceId()));
            case "INSTITUTION" -> applyInstitutionMeta(vo, institutionMap.get(row.getResourceId()));
            case "CASE" -> applyCaseMeta(vo, caseMap.get(row.getResourceId()));
            default -> { }
        }
        return vo;
    }

    void applyTrainerMeta(RecommendedResourceItemVO vo, Trainer trainer) {
        if (trainer == null) {
            return;
        }
        vo.setResourceName(trainer.getTeachingName() != null && !trainer.getTeachingName().isBlank()
                ? trainer.getTeachingName() : trainer.getName());
        vo.setResourceCoverUrl(trainer.getAvatar());
        vo.setResourceDescription(trainer.getOneLineIntro());
        vo.setResourceMeta(trainer.getExpertiseTags());
        vo.setResourceStatus(trainer.getStatus());
    }

    void applyCourseMeta(RecommendedResourceItemVO vo, Course course) {
        if (course == null) {
            return;
        }
        vo.setResourceName(course.getTitle());
        vo.setResourceCoverUrl(course.getCoverUrl());
        vo.setResourceDescription(course.getSummary());
        vo.setResourceMeta(course.getType() != null ? course.getType().name() : null);
        vo.setResourceStatus(course.getStatus());
    }

    void applyInstitutionMeta(RecommendedResourceItemVO vo, Institution institution) {
        if (institution == null) {
            return;
        }
        vo.setResourceName(institution.getOrgName());
        vo.setResourceCoverUrl(institution.getLogoUrl());
        vo.setResourceDescription(institution.getClientCases());
        vo.setResourceMeta(institution.getSuccessCases());
        vo.setResourceStatus(institution.getStatus());
    }

    void applyCaseMeta(RecommendedResourceItemVO vo, TrainerCaseResponse caseItem) {
        if (caseItem == null) {
            return;
        }
        vo.setResourceName(caseItem.getCaseTitle());
        vo.setResourceCoverUrl(caseItem.getCoverImage());
        vo.setResourceDescription(caseItem.getDescription());
        vo.setResourceMeta(caseItem.getIndustry());
        vo.setResourceStatus(caseItem.getStatus());
    }
}
