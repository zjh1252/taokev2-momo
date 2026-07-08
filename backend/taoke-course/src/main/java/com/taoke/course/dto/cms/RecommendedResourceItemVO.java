package com.taoke.course.dto.cms;

import lombok.Data;

/**
 * 推荐资源位列表项
 *
 * @author Fangxinxin
 * @date 2026-06-12 18:00
 */
@Data
public class RecommendedResourceItemVO {

    private Integer id;
    private String slotCode;
    private String resourceType;
    private Integer resourceId;
    private Integer categoryId;
    private String roleType;
    private Integer sortOrder;

    private String coverUrl;
    private String consultButtonImageUrl;
    private String topicButtonImageUrl;
    private String topicButtonLinkUrl;
    private String title;
    private String description;
    private String chiefIntro;
    private String expertiseOverride;
    private String keyTags;
    private String adminNote;

    /** 资源展示名（专家名/课程名/案例名/机构名） */
    private String resourceName;

    /** 资源原始封面 */
    private String resourceCoverUrl;

    /** 资源原始简介/一句话介绍 */
    private String resourceDescription;

    /** 资源原始擅长领域/行业等 */
    private String resourceMeta;

    /** 资源状态（上架/审核通过等） */
    private Integer resourceStatus;

    /** 推荐项上架时间 */
    private java.time.LocalDateTime createdAt;
}
