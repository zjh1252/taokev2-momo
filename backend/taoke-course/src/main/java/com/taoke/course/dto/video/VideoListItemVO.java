package com.taoke.course.dto.video;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 录播课列表项（轻量化字段，用于分页列表展示）
 *
 * @author Fangxinxin
 * @date 2026-04-07 14:00
 */
@Data
public class VideoListItemVO {

    private Integer id;
    private String title;
    private String videoType;
    private String videoTypeLabel;
    private String coverUrl;

    private Integer categoryId;
    private String categoryName;

    private String teacherName;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer isFree;

    private Integer duration;
    private Integer totalEpisodes;

    private Integer status;
    private String statusLabel;

    private Integer viewCount;
    private Integer enrollmentCount;
    private Integer studentCount;
    private BigDecimal score;

    private String publisherType;
    private String publisherName;
    private String keywords;

    private Integer isFeatured;
    private Integer sortOrder;

    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
}
