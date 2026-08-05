package com.taoke.course.service.cms;

import com.taoke.common.exception.BusinessException;
import com.taoke.course.api.RecommendationSlotConfigService;
import com.taoke.course.dto.cms.AddRecommendedResourceRequest;
import com.taoke.course.dto.cms.UpdateRecommendedResourceRequest;
import com.taoke.course.entity.cms.RecommendedResource;
import com.taoke.course.enums.RecommendationSlot;
import com.taoke.course.repository.RecommendedResourceRepository;
import com.taoke.course.support.PublicRecommendationCache;
import com.taoke.user.api.InstitutionService;
import com.taoke.user.api.TrainerService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * HOME_BANNER 轮播大图必填校验。
 *
 * @author Fangxinxin
 * @date 2026-07-29 16:40
 */
@ExtendWith(MockitoExtension.class)
class RecommendedResourceServiceImplHomeBannerCoverTest {

    @Mock private RecommendedResourceRepository recommendedResourceRepository;
    @Mock private RecommendationSlotConfigService recommendationSlotConfigService;
    @Mock private RecommendedResourceEnricher enricher;
    @Mock private TrainerService trainerService;
    @Mock private InstitutionService institutionService;
    @Mock private PublicRecommendationCache publicRecommendationCache;

    @InjectMocks
    private RecommendedResourceServiceImpl service;

    @Test
    void add_rejectsBlankCoverForHomeBanner() {
        AddRecommendedResourceRequest request = new AddRecommendedResourceRequest();
        request.setSlotCode(RecommendationSlot.HOME_BANNER.getCode());
        request.setResourceType("BANNER");
        request.setResourceId(1);
        request.setCoverUrl("  ");

        BusinessException ex = assertThrows(BusinessException.class, () -> service.add(request));

        assertEquals("请上传或填写轮播图大图", ex.getMessage());
        verify(recommendedResourceRepository, never()).save(any());
    }

    @Test
    void update_rejectsBlankCoverForHomeBanner() {
        RecommendedResource entity = new RecommendedResource();
        entity.setId(9);
        entity.setSlotCode(RecommendationSlot.HOME_BANNER.getCode());
        entity.setCoverUrl("https://cdn.example.com/banner.png");
        when(recommendedResourceRepository.findById(9)).thenReturn(Optional.of(entity));

        UpdateRecommendedResourceRequest request = new UpdateRecommendedResourceRequest();
        request.setCoverUrl("");

        BusinessException ex = assertThrows(BusinessException.class, () -> service.update(9, request));

        assertEquals("请上传或填写轮播图大图", ex.getMessage());
        verify(recommendedResourceRepository, never()).save(any());
    }
}
