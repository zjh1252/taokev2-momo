package com.taoke.course.dto.course;

import lombok.Data;

/**
 * 专家详情页推荐课程项 — 轻量化展示（封面、标题、浏览量）
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Data
public class RecommendedCourseVO {

    private Integer id;
    private String title;
    private String coverUrl;
    private Integer viewCount;
}
