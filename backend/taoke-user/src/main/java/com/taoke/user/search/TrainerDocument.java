package com.taoke.user.search;

import com.taoke.common.search.BaseDocument;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 专家 ES 文档 — 索引到 ES 的讲师数据结构。
 * <p>
 * 后续如需更多关联数据在 {@link TrainerDocumentProvider} 中扩展构建逻辑。
 *
 * @author Fangxinxin
 * @date 2026-04-14 19:00
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class TrainerDocument extends BaseDocument {

    private String name;
    private String avatar;
    private String title;

    /** 个人简介（纯文本，已去除 HTML 标签） */
    private String bio;

    /** 详细介绍（纯文本，已去除 HTML 标签） */
    private String intro;

    private String goodAt;
    private String specialties;
    private String expertiseTags;
    private String teachingStyle;

    private Integer experienceYears;
    private Integer teachingYears;
    private Integer certLevel;
    private Integer isSigned;
    private Integer isRecommended;

    private Integer sortOrder;
    private BigDecimal score;
    private Integer viewCount;

    private LocalDateTime approvedAt;

    // ==================== 关联字段（由 Provider 构建时填充） ====================

    private Integer provinceId;
    private String provinceName;
    private Integer cityId;
    private String cityName;
}
