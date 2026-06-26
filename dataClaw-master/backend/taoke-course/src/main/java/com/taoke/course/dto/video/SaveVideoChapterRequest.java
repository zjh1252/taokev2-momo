package com.taoke.course.dto.video;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建/编辑录播课章节请求体
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Data
public class SaveVideoChapterRequest {

    /** 所属系列ID，0=不属于任何系列 */
    private Integer seriesId;

    @NotBlank(message = "章节标题不能为空")
    private String title;

    private String description;

    /** 视频地址 */
    private String videoUrl;

    /** 章节封面URL */
    private String coverUrl;

    /** 时长（秒） */
    private Integer duration;

    /** 文件大小（字节） */
    private Long fileSize;

    /** 排序 */
    private Integer sortOrder;

    /** 是否可免费预览 */
    private Integer isPreview;
}
