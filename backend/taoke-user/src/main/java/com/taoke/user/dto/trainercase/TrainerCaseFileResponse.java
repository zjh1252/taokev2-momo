package com.taoke.user.dto.trainercase;

import com.taoke.user.entity.TrainerCaseFile;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 案例文件响应 DTO
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:00
 */
@Data
public class TrainerCaseFileResponse {

    private Integer id;
    private Integer caseId;
    private Integer fileType;
    private String title;
    private String description;
    private String fileUrl;
    private String thumbnailUrl;
    private Integer width;
    private Integer height;
    private Integer duration;
    private Long fileSize;
    private Boolean autoExtracted;
    private Integer sortOrder;
    private Integer status;
    private String rejectReason;
    private Integer viewCount;
    private LocalDateTime createdAt;

    public static TrainerCaseFileResponse from(TrainerCaseFile entity) {
        TrainerCaseFileResponse r = new TrainerCaseFileResponse();
        r.setId(entity.getId());
        r.setCaseId(entity.getCaseId());
        r.setFileType(entity.getFileType());
        r.setTitle(entity.getTitle());
        r.setDescription(entity.getDescription());
        r.setFileUrl(entity.getFileUrl());
        r.setThumbnailUrl(entity.getThumbnailUrl());
        r.setWidth(entity.getWidth());
        r.setHeight(entity.getHeight());
        r.setDuration(entity.getDuration());
        r.setFileSize(entity.getFileSize());
        r.setAutoExtracted(entity.getAutoExtracted());
        r.setSortOrder(entity.getSortOrder());
        r.setStatus(entity.getStatus());
        r.setRejectReason(entity.getRejectReason());
        r.setViewCount(entity.getViewCount());
        r.setCreatedAt(entity.getCreatedAt());
        return r;
    }
}
