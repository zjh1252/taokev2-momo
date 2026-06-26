package com.taoke.course.dto.video;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 录播课系列 VO
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Data
public class VideoSeriesVO {

    private Integer id;
    private Integer videoId;
    private String title;
    private String description;
    private String coverUrl;
    private Integer sortOrder;
    private Integer chapterCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 系列下的章节列表 */
    private List<VideoChapterVO> chapters;
}
