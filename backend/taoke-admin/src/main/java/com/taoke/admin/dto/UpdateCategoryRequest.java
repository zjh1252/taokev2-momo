package com.taoke.admin.dto;

import lombok.Data;

/**
 * 编辑分类请求（所有字段可选，仅传入需修改的字段）。
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:00
 */
@Data
public class UpdateCategoryRequest {

    private String name;

    private Integer sortOrder;

    /** 是否可见：0=隐藏, 1=可见 */
    private Integer isVisible;

    private String icon;

    private String description;
}
