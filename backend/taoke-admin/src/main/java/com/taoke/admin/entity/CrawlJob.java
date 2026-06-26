package com.taoke.admin.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.time.LocalDateTime;

/**
 * 爬虫任务记录表实体 — 对应 crawl_jobs 表。
 * <p>
 * 记录每次爬取任务的状态和统计信息。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "crawl_jobs")
public class CrawlJob extends BaseEntity {

    /** 数据源标识 */
    @Column(name = "source", nullable = false, length = 50)
    private String source;

    /** 数据类型：TRAINER/COURSE */
    @Column(name = "data_type", nullable = false, length = 20)
    private String dataType;

    /** 状态：0=待执行 1=运行中 2=已完成 3=失败 4=已取消 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 0;

    /** 爬取配置（起始 URL、参数等） */
    @Column(name = "config_json", columnDefinition = "json")
    private String configJson;

    /** Python 服务端的任务 ID */
    @Column(name = "crawler_job_id", length = 100)
    private String crawlerJobId;

    /** 总计爬取条数 */
    @Column(name = "total_count")
    private Integer totalCount = 0;

    /** 已处理条数 */
    @Column(name = "processed_count")
    private Integer processedCount = 0;

    /** 成功入库条数 */
    @Column(name = "success_count")
    private Integer successCount = 0;

    /** 去重跳过条数 */
    @Column(name = "duplicate_count")
    private Integer duplicateCount = 0;

    /** 错误条数 */
    @Column(name = "error_count")
    private Integer errorCount = 0;

    /** 失败原因 */
    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    /** 当前进度说明 */
    @Column(name = "progress_message", length = 500)
    private String progressMessage;

    /** 开始时间 */
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /** 完成时间 */
    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    /** 触发人 user_id */
    @Column(name = "triggered_by", nullable = false)
    private Integer triggeredBy;
}
