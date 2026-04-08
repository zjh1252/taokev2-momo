package com.taoke.course.dto.interaction;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 评价列表视图对象
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Data
public class ReviewVO {

    private Integer id;
    private String reviewScope;
    private Integer courseId;
    private Integer trainerUserId;

    private String expertName;
    private LocalDate trainingDate;
    private BigDecimal courseDays;
    private String courseTitle;
    private String clientCompany;
    private String trainingLocation;

    private Integer ratingContent;
    private Integer ratingTeaching;
    private Integer ratingService;
    private BigDecimal avgScore;

    private String commentText;
    private List<String> photoUrls;

    private String submitterName;
    private Boolean anonymous;
    private Integer status;

    private LocalDateTime createdAt;
}
