package com.taoke.admin.dto.crawl;

import lombok.Data;

/**
 * 爬虫任务列表查询参数
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class CrawlJobQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 按数据源过滤 */
    private String source;

    /** 按数据类型过滤 */
    private String dataType;

    /** 按状态过滤 */
    private Integer status;
}
