package com.taoke.course.service.cms;



import com.taoke.common.exception.BusinessException;

import com.taoke.common.exception.ErrorCode;

import com.taoke.course.api.RecommendationSlotConfigService;
import com.taoke.course.api.RecommendedResourceService;

import com.taoke.course.dto.cms.AddRecommendedResourceRequest;

import com.taoke.course.dto.cms.RecommendedResourceItemVO;

import com.taoke.course.dto.cms.ReorderRecommendedResourcesRequest;

import com.taoke.course.dto.cms.RecommendationSlotConfigVO;

import com.taoke.course.dto.cms.UpdateRecommendationSlotConfigRequest;

import com.taoke.course.dto.cms.UpdateRecommendedResourceRequest;

import com.taoke.course.entity.cms.RecommendedResource;

import com.taoke.course.enums.RecommendationSlot;

import com.taoke.course.repository.RecommendedResourceRepository;

import com.taoke.user.api.InstitutionService;

import com.taoke.user.api.TrainerService;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;



import java.util.List;

import java.util.Map;

import java.util.Objects;

import java.util.function.Function;

import java.util.stream.Collectors;



/**

 * 推荐资源位管理服务实现

 *

 * @author Fangxinxin

 * @date 2026-06-12 18:00

 */

@Service

public class RecommendedResourceServiceImpl implements RecommendedResourceService {



    private static final String ROLE_PRIMARY = "PRIMARY";

    private static final String ROLE_BACKUP = "BACKUP";



    private static final List<String> TRAINER_LEGACY_SLOTS = List.of(

            RecommendationSlot.HOME_TRAINER.getCode(),

            RecommendationSlot.TRAINER_LIST_TRAINER.getCode());



    private final RecommendedResourceRepository recommendedResourceRepository;

    private final RecommendationSlotConfigService recommendationSlotConfigService;

    private final RecommendedResourceEnricher enricher;

    private final TrainerService trainerService;

    private final InstitutionService institutionService;

    public RecommendedResourceServiceImpl(
            RecommendedResourceRepository recommendedResourceRepository,
            RecommendationSlotConfigService recommendationSlotConfigService,
            RecommendedResourceEnricher enricher,
            TrainerService trainerService,
            InstitutionService institutionService) {
        this.recommendedResourceRepository = recommendedResourceRepository;
        this.recommendationSlotConfigService = recommendationSlotConfigService;
        this.enricher = enricher;
        this.trainerService = trainerService;
        this.institutionService = institutionService;
    }

    @Override

    @Transactional(readOnly = true)

    public List<RecommendedResourceItemVO> listBySlot(String slotCode, Integer categoryId) {

        List<RecommendedResource> rows = categoryId != null

                ? recommendedResourceRepository.findBySlotCodeAndCategoryIdOrderBySortOrderDescIdDesc(

                        slotCode, categoryId)

                : recommendedResourceRepository.findBySlotCodeAndCategoryIdIsNullOrderBySortOrderDescIdDesc(

                        slotCode);

        return enricher.enrich(slotCode, rows);

    }



    @Override

    @Transactional

    public RecommendedResourceItemVO add(AddRecommendedResourceRequest request) {

        RecommendationSlot slot = RecommendationSlot.fromCode(request.getSlotCode());

        validateResourceType(slot, request.getResourceType());



        String roleType = normalizeRoleType(request.getRoleType());

        Integer categoryId = request.getCategoryId();



        if (recommendedResourceRepository.existsBySlotCodeAndResourceTypeAndResourceIdAndCategoryIdAndRoleType(

                request.getSlotCode(), request.getResourceType(), request.getResourceId(), categoryId, roleType)) {

            throw new BusinessException(ErrorCode.PARAM_INVALID, "该资源已在当前推荐位中");

        }



        RecommendedResource entity = new RecommendedResource();

        entity.setSlotCode(request.getSlotCode());

        entity.setResourceType(request.getResourceType());

        entity.setResourceId(request.getResourceId());

        entity.setCategoryId(categoryId);

        entity.setRoleType(roleType);

        entity.setSortOrder(nextSortOrder(request.getSlotCode(), categoryId));

        entity.setCoverUrl(request.getCoverUrl());

        entity.setTitle(request.getTitle());

        entity.setDescription(request.getDescription());

        entity.setChiefIntro(request.getChiefIntro());

        entity.setExpertiseOverride(request.getExpertiseOverride());

        entity.setKeyTags(request.getKeyTags());

        entity.setAdminNote(request.getAdminNote());



        RecommendedResource saved = recommendedResourceRepository.save(entity);

        syncLegacyFlags(saved, true);



        return listBySlot(request.getSlotCode(), categoryId).stream()

                .filter(item -> Objects.equals(item.getId(), saved.getId()))

                .findFirst()

                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR, "推荐资源创建失败"));

    }



    @Override

    @Transactional

    public RecommendedResourceItemVO update(Integer id, UpdateRecommendedResourceRequest request) {

        RecommendedResource entity = recommendedResourceRepository.findById(id)

                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "推荐资源不存在"));



        if (request.getCoverUrl() != null) {

            entity.setCoverUrl(request.getCoverUrl());

        }

        if (request.getTitle() != null) {

            entity.setTitle(request.getTitle());

        }

        if (request.getDescription() != null) {

            entity.setDescription(request.getDescription());

        }

        if (request.getChiefIntro() != null) {

            entity.setChiefIntro(request.getChiefIntro());

        }

        if (request.getExpertiseOverride() != null) {

            entity.setExpertiseOverride(request.getExpertiseOverride());

        }

        if (request.getKeyTags() != null) {

            entity.setKeyTags(request.getKeyTags());

        }

        if (request.getAdminNote() != null) {

            entity.setAdminNote(request.getAdminNote());

        }



        recommendedResourceRepository.save(entity);

        return listBySlot(entity.getSlotCode(), entity.getCategoryId()).stream()

                .filter(item -> Objects.equals(item.getId(), id))

                .findFirst()

                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR, "推荐资源更新失败"));

    }



    @Override

    @Transactional

    public void remove(Integer id) {

        RecommendedResource entity = recommendedResourceRepository.findById(id)

                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "推荐资源不存在"));

        recommendedResourceRepository.delete(entity);

        syncLegacyFlags(entity, false);

    }



    @Override

    @Transactional

    public void reorder(ReorderRecommendedResourcesRequest request) {

        List<RecommendedResource> rows = request.getCategoryId() != null

                ? recommendedResourceRepository.findBySlotCodeAndCategoryIdOrderBySortOrderDescIdDesc(

                        request.getSlotCode(), request.getCategoryId())

                : recommendedResourceRepository.findBySlotCodeAndCategoryIdIsNullOrderBySortOrderDescIdDesc(

                        request.getSlotCode());



        Map<Integer, RecommendedResource> byId = rows.stream()

                .collect(Collectors.toMap(RecommendedResource::getId, Function.identity()));



        int sort = request.getOrderedIds().size();

        for (Integer orderedId : request.getOrderedIds()) {

            RecommendedResource row = byId.get(orderedId);

            if (row == null) {

                continue;

            }

            row.setSortOrder(sort--);

            recommendedResourceRepository.save(row);

        }

    }



    private int nextSortOrder(String slotCode, Integer categoryId) {

        List<RecommendedResource> existing = categoryId != null

                ? recommendedResourceRepository.findBySlotCodeAndCategoryIdOrderBySortOrderDescIdDesc(

                        slotCode, categoryId)

                : recommendedResourceRepository.findBySlotCodeAndCategoryIdIsNullOrderBySortOrderDescIdDesc(

                        slotCode);

        return existing.stream().map(RecommendedResource::getSortOrder).max(Integer::compareTo).orElse(0) + 1;

    }



    private void validateResourceType(RecommendationSlot slot, String resourceType) {

        if (!slot.getResourceType().equals(resourceType)) {

            throw new BusinessException(ErrorCode.PARAM_INVALID, "资源类型与推荐位不匹配");

        }

    }



    private String normalizeRoleType(String roleType) {

        if (ROLE_BACKUP.equalsIgnoreCase(roleType)) {

            return ROLE_BACKUP;

        }

        return ROLE_PRIMARY;

    }



    /** 同步旧字段 is_recommended，保持 C 端回退逻辑一致 */

    private void syncLegacyFlags(RecommendedResource entity, boolean adding) {

        if ("TRAINER".equals(entity.getResourceType())) {

            syncTrainerLegacy(entity, adding);

            return;

        }

        if ("INSTITUTION".equals(entity.getResourceType())) {

            syncInstitutionLegacy(entity, adding);

        }

    }



    private void syncTrainerLegacy(RecommendedResource entity, boolean adding) {

        if (adding) {

            trainerService.setRecommended(entity.getResourceId(), 1);

            return;

        }

        boolean stillRecommended = recommendedResourceRepository.existsBySlotCodeInAndResourceTypeAndResourceId(

                TRAINER_LEGACY_SLOTS, "TRAINER", entity.getResourceId());

        if (!stillRecommended) {

            trainerService.setRecommended(entity.getResourceId(), 0);

        }

    }



    private void syncInstitutionLegacy(RecommendedResource entity, boolean adding) {

        if (!RecommendationSlot.INSTITUTION_GOLD.getCode().equals(entity.getSlotCode())) {

            return;

        }

        if (adding) {

            institutionService.setRecommended(entity.getResourceId(), 1);

            return;

        }

        boolean stillRecommended = recommendedResourceRepository.existsBySlotCodeAndResourceTypeAndResourceId(

                RecommendationSlot.INSTITUTION_GOLD.getCode(), "INSTITUTION", entity.getResourceId());

        if (!stillRecommended) {

            institutionService.setRecommended(entity.getResourceId(), 0);

        }

    }

    @Override
    @Transactional(readOnly = true)
    public RecommendationSlotConfigVO getSlotConfig(String slotCode) {
        return recommendationSlotConfigService.getSlotConfig(slotCode);
    }

    @Override
    @Transactional
    public RecommendationSlotConfigVO updateSlotConfig(
            String slotCode, UpdateRecommendationSlotConfigRequest request) {
        return recommendationSlotConfigService.updateSlotConfig(slotCode, request);
    }

}

