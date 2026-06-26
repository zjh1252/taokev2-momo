package com.taoke.admin.dto.crawl;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 爬取专家详情 VO（含 JSON 子数据解析）
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class CrawledTrainerDetailVO {

    private Integer id;
    private String source;
    private String sourceUrl;
    private String sourceTrainerId;

    // 核心信息
    private String name;
    private String teachingName;
    private String avatar;
    private String title;
    private Integer gender;
    private String oneLineIntro;
    private String bio;
    private String intro;
    private String background;
    private String goodAt;
    private String specialties;
    private String expertiseTags;
    private String teachingStyle;
    private Integer experienceYears;
    private Integer teachingYears;
    private Integer provinceId;
    private Integer cityId;
    private String partialClients;

    // JSON 子数据（已解析为列表）
    private List<EducationItem> educationList;
    private List<ExperienceItem> experienceList;
    private List<HonorItem> honorsList;
    private List<BookItem> booksList;
    private List<CourseItem> coursesList;
    private List<CaseItem> casesList;

    // 去重
    private Integer dedupStatus;
    private String dedupStatusText;
    private Integer dedupTrainerId;
    private String dedupReason;

    // 审核
    private Integer reviewStatus;
    private String reviewStatusText;
    private String reviewRejectReason;
    private LocalDateTime reviewedAt;
    private Integer importedTrainerId;

    private LocalDateTime createdAt;
    private Map<String, Object> rawJson;

    // ==================== 内部类 ====================

    @Data
    public static class EducationItem {
        private String school;
        private String major;
        private String degree;
        private String startDate;
        private String endDate;
    }

    @Data
    public static class ExperienceItem {
        private String company;
        private String position;
        private String startDate;
        private String endDate;
        private String description;
    }

    @Data
    public static class HonorItem {
        private String name;
        private String authority;
        private String date;
        private String description;
    }

    @Data
    public static class BookItem {
        private String title;
        private String publisher;
        private String publishDate;
        private String description;
    }

    @Data
    public static class CourseItem {
        private String title;
        private String type;
        private String category;
        private String summary;
    }

    @Data
    public static class CaseItem {
        private String title;
        private String client;
        private String description;
    }
}
