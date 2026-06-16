package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 后台著作列表/详情 VO
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:30
 */
@Data
public class AdminBookVO {

    private Integer id;
    private String coverUrl;
    private String title;
    private String authorName;
    private Integer trainerId;
    private String trainerName;
    private Integer submitterUserId;
    private String submitterNickname;
    private LocalDateTime createdAt;
    private Integer status;
    private String statusLabel;
    private String rejectReason;
    private String publisher;
    private LocalDate publishDate;
    private String description;
    private String buyUrl;
    private LocalDateTime reviewedAt;
}
