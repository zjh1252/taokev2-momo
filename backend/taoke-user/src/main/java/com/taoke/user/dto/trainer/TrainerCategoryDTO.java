package com.taoke.user.dto.trainer;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 专家培训领域分类 DTO（输入/输出复用）
 *
 * @author Fangxinxin
 * @date 2026-04-01 23:30
 */
@Data
public class TrainerCategoryDTO {

    private Integer id;

    @NotNull(message = "分类 ID 不能为空")
    private Integer categoryId;

    private Integer sortOrder = 0;
}
