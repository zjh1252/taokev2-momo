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
    private String categoryNameRaw;
    private String coverUrl;
    private BigDecimal price;
    private Integer durationDays;
    private String trainerNameRaw;

    /** 去重状态 */
    private Integer dedupStatus;
    private String dedupStatusText;
    private String dedupReason;

    /** 审核状态 */
    private Integer reviewStatus;
    private String reviewStatusText;

    private LocalDateTime createdAt;
}
