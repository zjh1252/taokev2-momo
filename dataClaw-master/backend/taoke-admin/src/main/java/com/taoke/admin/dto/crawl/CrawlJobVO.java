package com.taoke.admin.dto.crawl;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 爬虫任务 VO
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class CrawlJobVO {

    private Integer id;
    private String source;
    private String dataType;

    /** 状态：0=待执行 1=运行中 2=已完成 3=失败 4=已取消 */
    private Integer status;
    private String statusLabel;

    private String crawlerJobId;
    private Integer totalCount;
    private Integer processedCount;
    private Integer successCount;
    private Integer duplicateCount;
    private Integer errorCount;
    private String errorMessage;
    private String progressMessage;

    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Integer triggeredBy;
    private String triggeredByName;
    private LocalDateTime createdAt;
}
