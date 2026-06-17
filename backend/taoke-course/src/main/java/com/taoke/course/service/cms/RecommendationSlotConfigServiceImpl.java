package com.taoke.course.service.cms;

import com.taoke.course.api.RecommendationSlotConfigService;
import com.taoke.course.dto.cms.RecommendationSlotConfigVO;
import com.taoke.course.dto.cms.UpdateRecommendationSlotConfigRequest;
import com.taoke.course.entity.cms.RecommendationSlotConfig;
import com.taoke.course.enums.RecommendationSlot;
import com.taoke.course.repository.RecommendationSlotConfigRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 推荐位布局配置实现
 *
 * @author Fangxinxin
 * @date 2026-06-16 16:40
 */
@Service
public class RecommendationSlotConfigServiceImpl implements RecommendationSlotConfigService {

    private final RecommendationSlotConfigRepository recommendationSlotConfigRepository;

    public RecommendationSlotConfigServiceImpl(
            RecommendationSlotConfigRepository recommendationSlotConfigRepository) {
        this.recommendationSlotConfigRepository = recommendationSlotConfigRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public RecommendationSlotConfigVO getSlotConfig(String slotCode) {
        RecommendationSlot.fromCode(slotCode);
        return recommendationSlotConfigRepository.findById(slotCode)
                .map(this::toVo)
                .orElseGet(() -> defaultConfig(slotCode));
    }

    @Override
    @Transactional
    public RecommendationSlotConfigVO updateSlotConfig(
            String slotCode, UpdateRecommendationSlotConfigRequest request) {
        RecommendationSlot.fromCode(slotCode);
        RecommendationSlotConfig entity = recommendationSlotConfigRepository.findById(slotCode)
                .orElseGet(() -> {
                    RecommendationSlotConfig created = new RecommendationSlotConfig();
                    created.setSlotCode(slotCode);
                    created.setLockMain(true);
                    created.setLockMiddle(true);
                    return created;
                });
        if (request.getLockMain() != null) {
            entity.setLockMain(request.getLockMain());
        }
        if (request.getLockMiddle() != null) {
            entity.setLockMiddle(request.getLockMiddle());
        }
        recommendationSlotConfigRepository.save(entity);
        return toVo(entity);
    }

    private RecommendationSlotConfigVO defaultConfig(String slotCode) {
        RecommendationSlotConfigVO vo = new RecommendationSlotConfigVO();
        vo.setSlotCode(slotCode);
        vo.setLockMain(true);
        vo.setLockMiddle(true);
        return vo;
    }

    private RecommendationSlotConfigVO toVo(RecommendationSlotConfig entity) {
        RecommendationSlotConfigVO vo = new RecommendationSlotConfigVO();
        vo.setSlotCode(entity.getSlotCode());
        vo.setLockMain(entity.getLockMain());
        vo.setLockMiddle(entity.getLockMiddle());
        return vo;
    }
}
