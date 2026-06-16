package com.taoke.admin.dto.crawl;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * Python 爬虫服务回调请求体
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class CrawlCallbackRequest {

    /** Python 服务端的任务 ID */
    @JsonAlias("job_id")
    private String jobId;

    /** 事件类型：progress/batch/complete/error */
    private String event;

    /** 爬取结果数据（batch 事件时有值） */
    private List<Map<String, Object>> items;

    /** 总计爬取条数（progress/complete 事件时有值） */
    private Integer total;

    /** 已处理条数（progress 事件时有值） */
    private Integer processed;

    /** 成功条数（progress 事件时有值） */
    @JsonAlias("success_count")
    private Integer successCount;

    /** 去重条数（progress 事件时有值） */
    @JsonAlias("duplicate_count")
    private Integer duplicateCount;

    /** 错误条数（progress/error 事件时有值） */
    @JsonAlias("error_count")
    private Integer errorCount;

    /** 当前进度说明 */
    private String message;

    /** 错误信息（error 事件时有值） */
    private String error;
}
