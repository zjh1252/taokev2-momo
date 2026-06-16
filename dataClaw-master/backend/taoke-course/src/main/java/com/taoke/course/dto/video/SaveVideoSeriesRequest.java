package com.taoke.course.dto.video;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建/编辑录播课系列请求体
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Data
public class SaveVideoSeriesRequest {

    @NotBlank(message = "系列标题不能为空")
    private String title;

    private String description;

    private String coverUrl;

    private Integer sortOrder;
}
