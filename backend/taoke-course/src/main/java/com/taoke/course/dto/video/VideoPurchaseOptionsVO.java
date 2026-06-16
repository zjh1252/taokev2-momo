package com.taoke.course.dto.video;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 录播课购买选项（单门 / 全系列、人数上限、企业封顶价）
 *
 * @author Fangxinxin
 * @date 2026-06-10 18:00
 */
@Data
public class VideoPurchaseOptionsVO {

    /** 是否可选择全系列购买 */
    private Boolean hasSeriesOption;

    /** 单门：单价（元/人/年） */
    private BigDecimal singlePrice;

    /** 单门：企业封顶价 */
    private BigDecimal singleCompanyPrice;

    /** 单门：最多购买人数，0 表示不限 */
    private Integer singleMaxQuantity;

    /** 单门：人数是否不限 */
    private Boolean singleQuantityUnlimited;

    /** 全系列商品 ID（video_package_groups.id） */
    private Integer seriesProductId;

    /** 全系列名称 */
    private String seriesPackageName;

    /** 全系列包含视频数 */
    private Integer seriesVideoCount;

    /** 全系列：单价（元/人/年） */
    private BigDecimal seriesPrice;

    /** 全系列：企业封顶价 */
    private BigDecimal seriesCompanyPrice;

    /** 全系列：最多购买人数，0 表示不限 */
    private Integer seriesMaxQuantity;

    /** 全系列：人数是否不限 */
    private Boolean seriesQuantityUnlimited;
}
