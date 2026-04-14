package com.taoke.common.search;

import io.swagger.v3.oas.annotations.Parameter;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 全文搜索请求参数 — 封装关键词 + docType + 高级筛选条件。
 * <p>
 * Controller 通过 {@code @ModelAttribute} 接收，所有字段均为可选。
 *
 * @author Fangxinxin
 * @date 2026-04-14 21:00
 */
@Data
public class SearchRequest {

    @Parameter(description = "搜索关键词")
    private String keyword;

    @Parameter(description = "文档类型：course / trainer")
    private String docType;

    @Parameter(description = "课程子类型，多个逗号分隔：INTERNAL / OPEN_OFFLINE / OPEN_ONLINE")
    private List<String> courseType;

    @Parameter(description = "课程分类 ID")
    private Integer categoryId;

    @Parameter(description = "课程子分类 ID")
    private Integer subCategoryId;

    @Parameter(description = "最低价格")
    private BigDecimal minPrice;

    @Parameter(description = "最高价格")
    private BigDecimal maxPrice;

    @Parameter(description = "授课天数")
    private Integer durationDays;

    @Parameter(description = "专家所在省份 ID")
    private Integer provinceId;

    @Parameter(description = "专家所在城市 ID")
    private Integer cityId;

    @Parameter(description = "最低教学年限")
    private Integer minExperienceYears;

    @Parameter(description = "页码，从 1 开始")
    private Integer page = 1;

    @Parameter(description = "每页条数")
    private Integer size = 20;
}
