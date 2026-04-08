package com.taoke.course.dto.video;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 上报章节播放进度请求
 *
 * @author Fangxinxin
 * @date 2026-04-08 10:00
 */
@Data
public class UpdateProgressRequest {

    @NotNull(message = "章节ID不能为空")
    private Integer chapterId;

    /** 当前已观看时长（秒） */
    @NotNull(message = "观看时长不能为空")
    @Min(value = 0, message = "观看时长不能为负")
    private Integer watchDuration;

    /** 章节总时长（秒） */
    @NotNull(message = "章节总时长不能为空")
    @Min(value = 1, message = "章节总时长必须大于0")
    private Integer chapterDuration;
}
