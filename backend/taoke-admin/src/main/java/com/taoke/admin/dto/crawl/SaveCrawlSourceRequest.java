package com.taoke.admin.dto.crawl;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 新增/更新爬虫数据源请求体。
 *
 * @author Fangxinxin
 * @date 2026-06-15 16:00
 */
@Data
public class SaveCrawlSourceRequest {

    @NotBlank(message = "数据源标识不能为空")
    @Pattern(regexp = "^[a-z][a-z0-9_]{1,48}$", message = "标识须为小写字母开头，仅含小写字母、数字、下划线")
    private String code;

    @NotBlank(message = "数据源名称不能为空")
    private String name;

    @NotBlank(message = "站点 URL 不能为空")
    private String url;

    @NotBlank(message = "数据类型不能为空")
    @Pattern(regexp = "^(TRAINER|COURSE)$", message = "数据类型须为 TRAINER 或 COURSE")
    private String dataType;

    private Boolean enabled = true;

    private Integer sortOrder;

    private String remark;
}
