package com.taoke.user.dto.trainerhighlight;

import com.taoke.user.entity.TrainerHighlight;
import lombok.Data;

import java.time.LocalDateTime;

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
    private Integer mediaType;
    private String title;
    private String description;
    private String mediaUrl;
    private String thumbnailUrl;
    private Integer duration;
    private Long fileSize;
    private Integer sortOrder;
    private Integer status;
    private String rejectReason;
    private Integer viewCount;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TrainerHighlightResponse from(TrainerHighlight entity) {
        TrainerHighlightResponse r = new TrainerHighlightResponse();
        r.setId(entity.getId());
        r.setTrainerId(entity.getTrainerId());
        r.setMediaType(entity.getMediaType());
        r.setTitle(entity.getTitle());
        r.setDescription(entity.getDescription());
        r.setMediaUrl(entity.getMediaUrl());
        r.setThumbnailUrl(entity.getThumbnailUrl());
        r.setDuration(entity.getDuration());
        r.setFileSize(entity.getFileSize());
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
