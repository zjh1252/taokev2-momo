package com.taoke.user.api;

import com.taoke.user.dto.trainerhighlight.SaveTrainerHighlightRequest;
import com.taoke.user.dto.trainerhighlight.TrainerHighlightResponse;
import com.taoke.user.entity.TrainerHighlight;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 专家精彩瞬间服务接口
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
public interface TrainerHighlightService {

    // ==================== 专家自服务 ====================

    List<TrainerHighlightResponse> listMyHighlights(Integer userId);

    TrainerHighlightResponse createHighlight(Integer userId, SaveTrainerHighlightRequest request);

    TrainerHighlightResponse updateHighlight(Integer userId, Integer highlightId,
                                             SaveTrainerHighlightRequest request);

    void deleteHighlight(Integer userId, Integer highlightId);

    /** 批量调整排序（按 ID 列表顺序） */
    void batchSort(Integer userId, List<Integer> ids);

    // ==================== C端公开 ====================

    List<TrainerHighlightResponse> listApprovedHighlights(Integer trainerId);

    // ==================== 后台管理 ====================

    TrainerHighlightResponse adminGetDetail(Integer highlightId);

    Page<TrainerHighlight> adminSearch(Integer trainerId, Integer status, int page, int size);

    void approve(Integer highlightId, Integer reviewerUserId);

    void reject(Integer highlightId, Integer reviewerUserId, String reason);
}
