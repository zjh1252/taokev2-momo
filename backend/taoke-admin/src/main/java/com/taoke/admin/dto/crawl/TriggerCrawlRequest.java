package com.taoke.admin.dto.crawl;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 触发爬取请求体
 *
 * @author Fangxinxin
 * @date 2026-05-12 10:00
 */
@Data
public class TriggerCrawlRequest {

    /** 数据源标识 */
    @NotBlank(message = "数据源不能为空")
    private String source;

    /** 数据类型：TRAINER/COURSE */
    @NotBlank(message = "数据类型不能为空")
    private String dataType;

    /** 爬取数量限制（可选） */
    private Integer maxItems;

    /** 起始 URL（可选，覆盖默认） */
    private String startUrl;
}
