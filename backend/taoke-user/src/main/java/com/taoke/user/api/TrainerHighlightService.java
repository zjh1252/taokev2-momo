package com.taoke.user.api;

import com.taoke.user.dto.trainerhighlight.SaveTrainerHighlightFileRequest;
import com.taoke.user.dto.trainerhighlight.SaveTrainerHighlightRequest;
import com.taoke.user.dto.trainerhighlight.TrainerHighlightFileResponse;
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

    /** 添加文件到精彩瞬间 */
    TrainerHighlightFileResponse addHighlightFile(Integer userId, Integer highlightId,
                                                  SaveTrainerHighlightFileRequest request);

    /** 删除精彩瞬间中的文件 */
    void deleteHighlightFile(Integer userId, Integer highlightId, Integer fileId);

    // ==================== C端公开 ====================

    List<TrainerHighlightResponse> listApprovedHighlights(Integer trainerId);

    /** 机构详情页：机构主体 + 挂靠专家已通过精彩瞬间 */
    List<TrainerHighlightResponse> listApprovedHighlightsForInstitution(Integer institutionId, int limit);

    // ==================== 后台管理 ====================

    TrainerHighlightResponse adminGetDetail(Integer highlightId);

    Page<TrainerHighlight> adminSearch(Integer trainerId, Integer status, String keyword, int page, int size);

    void approve(Integer highlightId, Integer reviewerUserId);

    void reject(Integer highlightId, Integer reviewerUserId, String reason);
}
