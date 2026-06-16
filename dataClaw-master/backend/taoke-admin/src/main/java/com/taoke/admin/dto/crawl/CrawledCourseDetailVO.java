package com.taoke.admin.dto.crawl;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 爬取课程详情 VO
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class CrawledCourseDetailVO {

    private Integer id;
    private String source;
    private String sourceUrl;
    private String sourceCourseId;

    // 核心信息
    private String title;
    private String type;
    private Integer categoryId;
    private Integer subCategoryId;
    private String categoryNameRaw;
    private String coverUrl;
    private String intro;
    private String summary;
    private String syllabus;
    private String audience;
    private String highlights;
    private Integer durationDays;
    private BigDecimal totalHours;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String keywords;
    private String trainerNameRaw;

    // JSON 子数据
    private List<PlanItem> plansList;
    private String targetAudience;
    private String learningOutcomes;

    // 去重
    private Integer dedupStatus;
    private String dedupStatusText;
    private Integer dedupCourseId;
    private String dedupReason;

    // 审核
    private Integer reviewStatus;
    private String reviewStatusText;
    private String reviewRejectReason;
    private LocalDateTime reviewedAt;
    private Integer importedCourseId;

    private LocalDateTime createdAt;
    private List<Map<String, Object>> servicesList;
    private Map<String, Object> rawJson;

    @Data
    public static class PlanItem {
        private String startTime;
        private String endTime;
        private String city;
        private String address;
    }
}
