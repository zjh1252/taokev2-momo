package com.taoke.course.api;

import com.taoke.course.dto.cms.RecommendationSlotConfigVO;
import com.taoke.course.dto.cms.UpdateRecommendationSlotConfigRequest;

/**
 * 推荐位布局配置
 *
 * @author Fangxinxin
 * @date 2026-06-16 16:40
 */
public interface RecommendationSlotConfigService {

    RecommendationSlotConfigVO getSlotConfig(String slotCode);

    RecommendationSlotConfigVO updateSlotConfig(
            String slotCode, UpdateRecommendationSlotConfigRequest request);
}
