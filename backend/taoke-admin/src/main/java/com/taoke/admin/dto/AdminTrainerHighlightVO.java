package com.taoke.admin.dto;

import com.taoke.user.dto.trainerhighlight.TrainerHighlightFileResponse;
import com.taoke.user.entity.TrainerHighlight;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

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
    /** 所属主体类型：TRAINER / INSTITUTION */
    private String ownerSubjectType;
    /** 所属主体名称 */
    private String ownerSubjectName;
    /** 发布用户 ID */
    private Integer submitterUserId;
    /** 发布用户名 */
    private String submitterUsername;
    private Integer institutionId;
    private String institutionName;
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

    public static AdminTrainerHighlightVO from(TrainerHighlight entity,
                                               List<TrainerHighlightFileResponse> files) {
        AdminTrainerHighlightVO vo = new AdminTrainerHighlightVO();
        vo.setId(entity.getId());
        vo.setTrainerId(entity.getTrainerId());
        vo.setTitle(entity.getTitle());
        vo.setDescription(entity.getDescription());
        vo.setCoverImage(entity.getCoverImage());
        vo.setSortOrder(entity.getSortOrder());
        vo.setStatus(entity.getStatus());
        vo.setRejectReason(entity.getRejectReason());
        vo.setViewCount(entity.getViewCount());
        vo.setReviewedAt(entity.getReviewedAt());
        vo.setCreatedAt(entity.getCreatedAt());
        vo.setUpdatedAt(entity.getUpdatedAt());
        vo.setFiles(files);
        return vo;
    }
}
