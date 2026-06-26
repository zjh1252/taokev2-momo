package com.taoke.user.dto.trainer;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 通用分类关联引用 DTO — 专家领域/行业两种关联表共用
 * <p>
 * 输入时只需传 categoryId + sortOrder；输出时 Service 层回填 categoryName。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:55
 */
@Data
public class CategoryRefDTO {

    private Integer id;

    @NotNull(message = "分类 ID 不能为空")
    private Integer categoryId;

    private Integer sortOrder = 0;

    /** 分类名称（仅响应时回填，请求时忽略） */
    private String categoryName;
}
