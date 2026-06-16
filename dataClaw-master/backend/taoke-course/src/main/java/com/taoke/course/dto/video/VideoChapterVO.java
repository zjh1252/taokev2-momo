package com.taoke.course.dto.video;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 录播课章节 VO
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Data
public class VideoChapterVO {

    private Integer id;
    private Integer videoId;
    private Integer seriesId;
    private String title;
    private String description;
    private String videoUrl;
    private String coverUrl;
    private Integer duration;
    private Long fileSize;
    private Integer sortOrder;
    private Integer isPreview;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
