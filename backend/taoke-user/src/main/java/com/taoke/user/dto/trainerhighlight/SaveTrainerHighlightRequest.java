package com.taoke.user.dto.trainerhighlight;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 新增/编辑精彩瞬间请求（父记录字段）
 *
 * @author Fangxinxin
 * @date 2026-07-29 15:30
 */
@Data
public class SaveTrainerHighlightRequest {

    @Size(max = 200, message = "标题不能超过200字")
    private String title;

    @Size(max = 500, message = "描述不能超过500字")
    private String description;

    @Size(max = 500, message = "封面图URL不能超过500字")
    private String coverImage;

    private Integer sortOrder;
}
