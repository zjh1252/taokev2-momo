package com.taoke.course.api;

import com.taoke.course.dto.cms.AddRecommendedResourceRequest;
import com.taoke.course.dto.cms.RecommendedResourceItemVO;
import com.taoke.course.dto.cms.ReorderRecommendedResourcesRequest;
import com.taoke.course.dto.cms.RecommendationSlotConfigVO;
import com.taoke.course.dto.cms.UpdateRecommendationSlotConfigRequest;
import com.taoke.course.dto.cms.UpdateRecommendedResourceRequest;

import java.util.List;

/**
 * 推荐资源位管理 API
 *
 * @author Fangxinxin
 * @date 2026-06-12 18:00
 */
public interface RecommendedResourceService {

    List<RecommendedResourceItemVO> listBySlot(String slotCode, Integer categoryId);

    RecommendedResourceItemVO add(AddRecommendedResourceRequest request);

    RecommendedResourceItemVO update(Integer id, UpdateRecommendedResourceRequest request);

    void remove(Integer id);

    void reorder(ReorderRecommendedResourcesRequest request);

    RecommendationSlotConfigVO getSlotConfig(String slotCode);

    RecommendationSlotConfigVO updateSlotConfig(
            String slotCode, UpdateRecommendationSlotConfigRequest request);
}
