package com.taoke.course.dto.cms;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 新增推荐资源请求
 *
 * @author Fangxinxin
 * @date 2026-06-12 18:00
 */
@Data
public class AddRecommendedResourceRequest {

    @NotBlank
    private String slotCode;

    @NotBlank
    private String resourceType;

    @NotNull
    private Integer resourceId;

    private Integer categoryId;

    /** PRIMARY / BACKUP，默认 PRIMARY */
    private String roleType;

    private String coverUrl;
    private String title;
    private String description;
    private String expertiseOverride;
    private String keyTags;
    private String adminNote;
}
