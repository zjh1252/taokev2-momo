package com.taoke.course.dto.video;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 录播课学习进度（整体 + 各章节）
 *
 * @author Fangxinxin
 * @date 2026-04-08 10:00
 */
@Data
public class VideoProgressVO {

    /** 整体进度（0~100） */
    private Integer overallProgress;

    /** 上次观看的章节ID */
    private Integer lastChapterId;

    /** 累计观看时长（秒） */
    private Integer totalWatchTime;

    /** 最近观看时间 */
    private LocalDateTime lastWatchedAt;

    /** 各章节进度 */
    private List<ChapterProgressItem> chapters;

    @Data
    public static class ChapterProgressItem {
        private Integer chapterId;
        private Integer watchDuration;
        private Integer chapterDuration;
        private Integer progress;
        private Boolean completed;
        private LocalDateTime lastWatchedAt;
    }
}
