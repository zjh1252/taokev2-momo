package com.taoke.user.dto.trainerhighlight;

import com.taoke.user.entity.TrainerHighlightFile;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 精彩瞬间文件响应 DTO
 *
 * @author Fangxinxin
 * @date 2026-04-11 20:00
 */
@Data
public class TrainerHighlightFileResponse {

    private Integer id;
    private Integer highlightId;
    private Integer fileType;
    private String title;
    private String fileUrl;
    private String thumbnailUrl;
    private Integer width;
    private Integer height;
    private Integer duration;
    private Long fileSize;
    private Integer sortOrder;
    private LocalDateTime createdAt;

    public static TrainerHighlightFileResponse from(TrainerHighlightFile entity) {
        TrainerHighlightFileResponse r = new TrainerHighlightFileResponse();
        r.setId(entity.getId());
        r.setHighlightId(entity.getHighlightId());
        r.setFileType(entity.getFileType());
        r.setTitle(entity.getTitle());
        r.setFileUrl(entity.getFileUrl());
        r.setThumbnailUrl(entity.getThumbnailUrl());
        r.setWidth(entity.getWidth());
        r.setHeight(entity.getHeight());
        r.setDuration(entity.getDuration());
        r.setFileSize(entity.getFileSize());
        r.setSortOrder(entity.getSortOrder());
        r.setCreatedAt(entity.getCreatedAt());
        return r;
    }
}
