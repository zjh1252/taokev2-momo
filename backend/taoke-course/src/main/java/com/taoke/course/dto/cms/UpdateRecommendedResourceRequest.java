package com.taoke.course.dto.cms;

import lombok.Data;

/**
 * 更新推荐资源详情请求
 *
 * @author Fangxinxin
 * @date 2026-06-12 18:00
 */
@Data
public class UpdateRecommendedResourceRequest {

    private String coverUrl;
    private String title;
    private String description;
    private String chiefIntro;
    private String expertiseOverride;
    private String keyTags;
    private String adminNote;
}
