package com.taoke.common.search;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

/**
 * 全文搜索请求参数 — 封装关键词 + docType + 高级筛选条件。
 *
 * <p>Controller 通过 {@code @ModelAttribute} 接收（即 GET 查询串），
 * 所有字段均为可选；缺省时返回全量召回（受默认分页 {@code page=1, size=20} 限制）。</p>
 *
 * <p>典型用法：</p>
 * <pre>{@code
 * // 公开课关键词搜索
 * GET /search?keyword=领导力&docType=course&courseType=OPEN_OFFLINE,OPEN_ONLINE
 *
 * // 专家按地区/教龄筛选
 * GET /search?docType=trainer&provinceId=310000&minExperienceYears=5
 * }</pre>
 *
 * @author Fangxinxin
 * @date 2026-04-14 21:00
 */
@Data
@Schema(name = "SearchRequest", description = "C 端全文搜索请求参数（@ModelAttribute 模式，所有字段可选）")
public class SearchRequest {

    @Parameter(
            description = "搜索关键词；命中字段：title / name / intro / bio / keywords / "
                    + "highlights / audience / goodAt / expertiseTags / trainerName / categoryName。"
                    + "为空时不进入全文匹配阶段，仅按筛选条件返回。",
            example = "领导力")
    private String keyword;

    @Parameter(
            description = "文档类型枚举：`course` 课程 / `trainer` 专家。"
                    + "为空时同时检索两种类型，可在结果的 `docType` 字段区分。",
            schema = @Schema(allowableValues = {"course", "trainer"}, example = "course"))
    private String docType;

    @Parameter(
            description = "课程子类型，可多选；查询串使用逗号分隔（如 `courseType=OPEN_OFFLINE,OPEN_ONLINE`）。"
                    + "枚举值：\n"
                    + "- `INTERNAL` 内训课\n"
                    + "- `OPEN_OFFLINE` 公开课-线下\n"
                    + "- `OPEN_ONLINE` 公开课-线上\n"
                    + "仅在 `docType=course` 或 `docType` 为空时生效。",
            example = "OPEN_OFFLINE,OPEN_ONLINE")
    private List<String> courseType;

    @Parameter(
            description = "课程一级分类 ID（来自 `categories` 表）。",
            example = "12")
    private Integer categoryId;

    @Parameter(
            description = "课程二级分类 ID（来自 `categories` 表 parent=categoryId 的子节点）。",
            example = "34")
    private Integer subCategoryId;

    @Parameter(
            description = "最低价格（含），单位元，最多 2 位小数。可与 `maxPrice` 组合形成区间。",
            example = "0")
    private BigDecimal minPrice;

    @Parameter(
            description = "最高价格（含），单位元，最多 2 位小数。可与 `minPrice` 组合形成区间。",
            example = "10000")
    private BigDecimal maxPrice;

    @Parameter(
            description = "授课天数精确匹配，常用于过滤「1 天」「2 天」等典型课程时长。",
            example = "2")
    private Integer durationDays;

    @Parameter(
            description = "专家所在省份 ID（行政区划 ID，来自 `regions` 表，例如上海=310000）。",
            example = "310000")
    private Integer provinceId;

    @Parameter(
            description = "专家所在城市 ID（行政区划 ID，来自 `regions` 表）。",
            example = "310100")
    private Integer cityId;

    @Parameter(
            description = "最低教学年限（含）。仅 `docType=trainer` 或不限定 docType 时生效。",
            example = "5")
    private Integer minExperienceYears;

    @Parameter(
            description = "专家擅长领域分类 ID，匹配专家文档中的 `expertiseCategoryIds` 数组任一元素。",
            example = "21")
    private Integer expertiseCategoryId;

    @Parameter(
            description = "页码，从 1 开始；缺省 1。",
            example = "1")
    private Integer page = 1;

    @Parameter(
            description = "每页条数，建议 ≤ 50；缺省 20。",
            example = "20")
    private Integer size = 20;
}
