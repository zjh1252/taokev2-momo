package com.taoke.admin.dto.crawl;

import lombok.Data;

/**
 * 数据源信息 VO
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class CrawlSourceVO {

    /** 数据源标识 */
    private String code;

    /** 数据源名称 */
    private String name;

    /** 数据源 URL */
    private String url;

    /** 支持的数据类型：TRAINER/COURSE */
    private String dataType;

    /** 当前状态：AVAILABLE/MAINTENANCE */
    private String status;
}
