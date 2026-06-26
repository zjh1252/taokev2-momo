package com.taoke.course.dto.cms;

import lombok.Data;

/**
 * C 端公开推荐位展示项
 *
 * @author Fangxinxin
 * @date 2026-06-12 20:00
 */
@Data
public class PublicRecommendedItemVO {

    private Integer resourceId;
    private String resourceType;
    private String roleType;
    private Integer sortOrder;

    /** 运营覆盖封面，优先于 resourceCoverUrl */
    private String coverUrl;
    private String title;
    private String description;
    private String chiefIntro;
    private String expertiseOverride;
    private String keyTags;

    private String resourceName;
    private String resourceCoverUrl;
    private String resourceDescription;
    private String resourceMeta;

    /** 专家 */
    private String teachingName;
    private String trainerTitle;
    private String oneLineIntro;
    private String expertiseTags;
    private String avatar;

    /** 课程 */
    private String courseType;
    private String courseSummary;
    private String trainerName;
    private String nextPlanStartDate;
    private String nextPlanCity;
    private Integer durationDays;

    /** 开课单位（机构发布者/老库 organid 解析） */
    private String publisherName;

    /** 案例 */
    private Integer trainerId;
    private String caseTitle;
    private String industry;
    private String trainingDate;
    private String trainerNameForCase;
    private String trainerAvatar;

    /** 机构 */
    private String orgName;
    private String logoUrl;
}
