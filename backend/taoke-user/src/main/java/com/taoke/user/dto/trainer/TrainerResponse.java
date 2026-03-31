package com.taoke.user.dto.trainer;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 专家档案返回
 *
 * @author Fangxinxin
 * @date 2026-03-31 18:00
 */
@Data
public class TrainerResponse {

    private Integer id;
    private String title;
    private String bio;
    private String specialties;
    private Integer experienceYears;
    private String education;
    private Integer qualificationLevel;
    private String homepageConfig;
    private String serviceCityIds;
    private String contactPreference;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
