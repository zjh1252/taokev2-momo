package com.taoke.course.dto.course;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

/**
 * 公开课程列表查询参数
 *
 * <p>聚合公开课列表页所有可用过滤条件：</p>
 * <ul>
 *   <li>基础过滤：分类 / 类型 / 公开课开关 / 关键词 / 机构</li>
 *   <li>开课计划过滤：开课省/市、开课时间范围（含快捷段：本周内 / 本月内 / 近三个月）</li>
 *   <li>价格过滤：价格区间 + 仅看免费</li>
 *   <li>报名状态：ENROLLING（仍可报名，存在未来开课计划） / ENDED（所有计划已开始或不存在未来计划）</li>
 *   <li>排序方式 + 分页</li>
 * </ul>
 *
 * @author Fangxinxin
 * @date 2026-04-22 22:00
 */
@Data
public class PublicCourseQuery {

    /**
     * 一级分类 ID 集合（多选）。
     * <p>请求示例：{@code ?categoryIds=1&categoryIds=2}。</p>
     */
    private List<Integer> categoryIds;

    /** 二级分类 ID 集合（多选） */
    private List<Integer> subCategoryIds;

    /** 课程类型：INTERNAL / OPEN_OFFLINE / OPEN_ONLINE */
    private String type;

    /** true=公开课，false=内训课，null=全部 */
    private Boolean isOpen;

    /** 模糊搜索（标题、关键词） */
    private String keyword;

    /** 排序：default / price / score / time / viewCount */
    private String sortBy;

    /** 机构 ID（user_institutions.id） */
    private Integer institutionId;

    // ---- 开课计划维度 ----

    /** 开课省份 ID 集合（多选，按开课计划过滤；OR 关系） */
    private List<Integer> provinceIds;

    /** 开课城市 ID 集合（多选，按开课计划过滤；OR 关系） */
    private List<Integer> cityIds;

    /** 开课时间起（包含），按 plan.startTime 过滤 */
    private LocalDate startTimeFrom;

    /** 开课时间止（包含到当日 23:59:59），按 plan.startTime 过滤 */
    private LocalDate startTimeTo;

    /**
     * 时间快捷段：thisWeek / thisMonth / nextThreeMonths。
     * <p>提供时由后端解析为 {@link #startTimeFrom} / {@link #startTimeTo}。</p>
     */
    private String timeQuick;

    // ---- 价格维度 ----

    /** 最低价（含），>=0 */
    private java.math.BigDecimal priceMin;

    /** 最高价（含） */
    private java.math.BigDecimal priceMax;

    /** 是否仅看免费课程：1=仅免费 */
    private Integer isFree;

    // ---- 报名状态 ----

    /**
     * 报名状态过滤：
     * <ul>
     *   <li>ENROLLING：存在 startTime &gt;= 当前时间的开课计划（可报名）</li>
     *   <li>ENDED：所有开课计划 startTime 均 &lt; 当前时间（已开始/已结束）</li>
     * </ul>
     */
    private String enrollStatus;

    // ---- 分页 ----

    private int page = 1;

    private int size = 15;
}
