package com.taoke.admin.dto.crawl;

import lombok.Data;

/**
 * 爬取专家列表查询参数
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class CrawledTrainerQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 按数据源过滤 */
    private String source;

    /** 按审核状态过滤：0=待审核 1=已通过 2=已驳回 3=已入库 */
    private Integer reviewStatus;

    /** 按去重状态过滤：0=未检查 1=无重复 2=有疑似重复 3=确认重复 */
    private Integer dedupStatus;

    /** 模糊搜索（姓名） */
    private String keyword;
}
