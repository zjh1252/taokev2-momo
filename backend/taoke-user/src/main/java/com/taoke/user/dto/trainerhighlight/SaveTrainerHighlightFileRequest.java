package com.taoke.user.dto.trainerhighlight;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 新增精彩瞬间文件请求
 *
 * @author Fangxinxin
 * @date 2026-04-11 20:00
 */
@Data
public class SaveTrainerHighlightFileRequest {

    /** 文件类型：1=图片, 2=视频 */
    @NotNull(message = "文件类型不能为空")
    private Integer fileType;

    @Size(max = 200, message = "标题不能超过200字")
    private String title;

    @NotBlank(message = "文件URL不能为空")
    @Size(max = 500, message = "文件URL不能超过500字")
    private String fileUrl;

    @Size(max = 500, message = "缩略图URL不能超过500字")
    private String thumbnailUrl;

    private Integer width;
    private Integer height;
    private Integer duration;
    private Long fileSize;
    private Integer sortOrder;
}
