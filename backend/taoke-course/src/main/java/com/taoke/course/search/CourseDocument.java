package com.taoke.course.search;

import com.taoke.common.search.BaseDocument;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 课程 ES 文档 — 索引到 ES 的课程数据结构。
 * <p>
 * 不是简单的实体映射，可能包含关联字段（讲师名、分类名等），
 * 后续如需更多关联数据在 {@link CourseDocumentProvider} 中扩展构建逻辑。
 *
 * @author Fangxinxin
 * @date 2026-04-14 19:00
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CourseDocument extends BaseDocument {

    private String title;
    private String type;
    private String coverUrl;

    /** 课程介绍（纯文本，已去除 HTML 标签） */
    private String intro;
    private String audience;
    private String highlights;
    private String keywords;

    private Integer durationDays;
    private BigDecimal hoursPerDay;
    private BigDecimal price;
    private BigDecimal originalPrice;

    private Integer isFeatured;
    private Integer isFree;
    private Integer sortOrder;
    private Integer viewCount;
    private Integer enrollmentCount;
    private BigDecimal score;

    private LocalDateTime publishedAt;

    // ==================== 关联字段（由 Provider 构建时填充） ====================

    private String trainerName;
    private String categoryName;
    private String subCategoryName;
}
