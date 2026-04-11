package com.taoke.user.dto.trainerhighlight;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 新增/编辑精彩瞬间请求
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Data
public class SaveTrainerHighlightRequest {

    /** 媒体类型：1=图片, 2=视频 */
    @NotNull(message = "媒体类型不能为空")
    private Integer mediaType;

    @Size(max = 200, message = "标题不能超过200字")
    private String title;

    @Size(max = 500, message = "描述不能超过500字")
    private String description;

    @NotBlank(message = "媒体URL不能为空")
    @Size(max = 500, message = "媒体URL不能超过500字")
    private String mediaUrl;

    @Size(max = 500, message = "缩略图URL不能超过500字")
    private String thumbnailUrl;

    /** 视频时长（秒） */
    private Integer duration;

    /** 文件大小（字节） */
    private Long fileSize;

    private Integer sortOrder;
}
