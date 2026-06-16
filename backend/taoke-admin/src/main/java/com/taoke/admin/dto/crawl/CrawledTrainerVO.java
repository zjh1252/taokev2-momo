package com.taoke.admin.dto.crawl;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 爬取专家列表项 VO
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class CrawledTrainerVO {

    private Integer id;
    private String source;
    private String sourceUrl;
    private String name;
    private String title;
    private String avatar;
    private String expertiseTags;
    private String teachingStyle;
    private Integer experienceYears;

    /** 去重状态：0=未检查 1=无重复 2=有疑似重复 3=确认重复 */
    private Integer dedupStatus;
    private String dedupStatusText;
    private String dedupReason;

    /** 审核状态：0=待审核 1=已通过 2=已驳回 3=已入库 */
    private Integer reviewStatus;
    private String reviewStatusText;

    private LocalDateTime createdAt;
}
