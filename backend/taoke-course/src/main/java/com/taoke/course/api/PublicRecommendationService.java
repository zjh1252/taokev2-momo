package com.taoke.course.api;

import com.taoke.course.dto.cms.PublicRecommendedItemVO;
import com.taoke.course.dto.cms.RecommendationSlotConfigVO;

import java.util.List;

/**
 * C 端公开推荐位查询
 *
 * @author Fangxinxin
 * @date 2026-06-12 20:00
 */
public interface PublicRecommendationService {

    /**
     * 按推荐位查询已上架/已通过资源，按 sort_order 倒序
     *
     * @param slotCode      推荐位编码
     * @param categoryId    擅长领域分类 ID（仅 TRAINER_CATEGORY_EXPERT）
     * @param limit         条数上限
     * @param includeBackup 是否包含 BACKUP 角色
     */
    List<PublicRecommendedItemVO> listPublic(
            String slotCode, Integer categoryId, int limit, boolean includeBackup);

    RecommendationSlotConfigVO getPublicSlotConfig(String slotCode);
}
