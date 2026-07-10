package com.taoke.admin.dto.crawl;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 爬取课程列表项 VO
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class CrawledCourseVO {

    private Integer id;
    private String source;
    private String sourceUrl;
    private String title;
    private String type;
    private String typeLabel;
    private Integer categoryId;
    private Integer subCategoryId;
    private String categoryName;
    private String subCategoryName;
    private String categoryNameRaw;
    private String coverUrl;
    private BigDecimal price;
    private String priceRaw;
    private String priceParseStatus;
    private String contentType;
    private Integer durationDays;
    private String trainerNameRaw;

    /** 去重状态 */
    private Integer dedupStatus;
    private String dedupStatusText;
    private String dedupTargetType;
    private Integer dedupTargetId;
    private String dedupMatchType;
    private Integer dedupScore;
    private LocalDateTime dedupCheckedAt;
    private String dedupReason;

    /** 审核状态 */
    private Integer reviewStatus;
    private String reviewStatusText;
    private String reviewRejectReason;
    private LocalDateTime reviewedAt;
    private Integer importedCourseId;

    private LocalDateTime createdAt;
}
