package com.taoke.user.dto.trainerhighlight;

import com.taoke.user.entity.TrainerHighlight;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 精彩瞬间响应 DTO
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Data
public class TrainerHighlightResponse {

    private Integer id;
    private Integer trainerId;
    /** 专家所属 user_id，用于代管角色编辑场景下的归属展示 */
    private Integer trainerUserId;
    /** 专家昵称，用于编辑场景下的归属展示 */
    private String trainerName;
    private String title;
    private String description;
    private String coverImage;
    private Integer sortOrder;
    private Integer status;
    private String rejectReason;
    private Integer viewCount;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 关联的文件列表 */
    private List<TrainerHighlightFileResponse> files;

    public static TrainerHighlightResponse from(TrainerHighlight entity) {
        TrainerHighlightResponse r = new TrainerHighlightResponse();
        r.setId(entity.getId());
        r.setTrainerId(entity.getTrainerId());
        r.setTitle(entity.getTitle());
        r.setDescription(entity.getDescription());
        r.setCoverImage(entity.getCoverImage());
        r.setSortOrder(entity.getSortOrder());
        r.setStatus(entity.getStatus());
        r.setRejectReason(entity.getRejectReason());
        r.setViewCount(entity.getViewCount());
        r.setReviewedAt(entity.getReviewedAt());
        r.setCreatedAt(entity.getCreatedAt());
        r.setUpdatedAt(entity.getUpdatedAt());
        return r;
    }
}
