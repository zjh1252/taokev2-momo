package com.taoke.course.dto.video;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 保存录播课供应商分类请求
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class SaveVideoSupplierCategoryRequest {

    private Integer parentId;

    @NotBlank(message = "分类名称不能为空")
    private String name;

    private Integer sortOrder;

    private BigDecimal totalPrice;

    private BigDecimal discountRate;

    private Boolean enabled;
}
