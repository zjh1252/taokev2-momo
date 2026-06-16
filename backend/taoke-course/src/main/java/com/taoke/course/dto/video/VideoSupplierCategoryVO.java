package com.taoke.course.dto.video;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 录播课供应商分类视图对象（树形）
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class VideoSupplierCategoryVO {

    private Integer id;

    private Integer supplierId;

    private Integer parentId;

    private String name;

    private Integer sortOrder;

    private BigDecimal totalPrice;

    private BigDecimal discountRate;

    private Boolean enabled;

    private Long videoCount;

    private List<VideoSupplierCategoryVO> children = new ArrayList<>();
}
