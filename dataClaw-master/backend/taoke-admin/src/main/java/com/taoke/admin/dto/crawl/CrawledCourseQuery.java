package com.taoke.admin.dto.crawl;

import lombok.Data;

/**
 * 爬取课程列表查询参数
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class CrawledCourseQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 按数据源过滤 */
    private String source;

    /** 按审核状态过滤 */
    private Integer reviewStatus;

    /** 按去重状态过滤 */
    private Integer dedupStatus;

    /** 模糊搜索（标题） */
    private String keyword;
}
