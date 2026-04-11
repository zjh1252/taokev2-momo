package com.taoke.admin.dto;

import com.taoke.user.entity.TrainerHighlight;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台精彩瞬间列表 VO
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Data
public class AdminTrainerHighlightVO {

    private Integer id;
    private Integer trainerId;
    private String trainerName;
    private Integer mediaType;
    private String title;
    private String mediaUrl;
    private String thumbnailUrl;
    private Integer sortOrder;
    private Integer status;
    private String rejectReason;
    private Integer viewCount;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AdminTrainerHighlightVO from(TrainerHighlight entity) {
        AdminTrainerHighlightVO vo = new AdminTrainerHighlightVO();
        vo.setId(entity.getId());
        vo.setTrainerId(entity.getTrainerId());
        vo.setMediaType(entity.getMediaType());
        vo.setTitle(entity.getTitle());
        vo.setMediaUrl(entity.getMediaUrl());
        vo.setThumbnailUrl(entity.getThumbnailUrl());
        vo.setSortOrder(entity.getSortOrder());
        vo.setStatus(entity.getStatus());
        vo.setRejectReason(entity.getRejectReason());
        vo.setViewCount(entity.getViewCount());
        vo.setReviewedAt(entity.getReviewedAt());
        vo.setCreatedAt(entity.getCreatedAt());
        vo.setUpdatedAt(entity.getUpdatedAt());
        return vo;
    }
}
