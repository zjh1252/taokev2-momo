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

    private Integer id;

    /** 数据源标识 */
    private String code;

    /** 数据源名称 */
    private String name;

    /** 数据源 URL */
    private String url;

    /** 支持的数据类型：TRAINER/COURSE */
    private String dataType;

    /** 展示状态：AVAILABLE / DISABLED */
    private String status;

    /** 是否启用 */
    private Boolean enabled;

    /** 是否内置种子（不可删除） */
    private Boolean builtIn;

    /** 排序 */
    private Integer sortOrder;

    /** 备注 */
    private String remark;
}
