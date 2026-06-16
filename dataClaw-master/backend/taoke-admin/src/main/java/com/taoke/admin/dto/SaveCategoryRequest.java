package com.taoke.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 新增/编辑分类请求。
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:00
 */
@Data
public class SaveCategoryRequest {

    /** 分类类型（新增时必填，如 TRAINER_EXPERTISE） */
    @NotBlank(message = "分类类型不能为空")
    private String type;

    /** 父级 ID，0 表示顶级 */
    private Integer parentId;

    @NotBlank(message = "分类名称不能为空")
    private String name;

    private Integer sortOrder;

    /** 是否可见：0=隐藏, 1=可见 */
    private Integer isVisible;

    private String icon;

    private String description;
}
