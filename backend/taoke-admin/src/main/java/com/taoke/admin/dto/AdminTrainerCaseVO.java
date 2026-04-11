package com.taoke.admin.dto;

import com.taoke.user.entity.TrainerCase;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 后台案例列表 VO
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:30
 */
@Data
public class AdminTrainerCaseVO {

    private Integer id;
    private Integer trainerId;
    private String trainerName;
    private String caseTitle;
    private String enterpriseName;
    private String industry;
    private String trainingTopic;
    private String coverImage;
    private Integer sortOrder;
    private Integer status;
    private String rejectReason;
    private LocalDate trainingDate;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AdminTrainerCaseVO from(TrainerCase entity) {
        AdminTrainerCaseVO vo = new AdminTrainerCaseVO();
        vo.setId(entity.getId());
        vo.setTrainerId(entity.getTrainerId());
        vo.setCaseTitle(entity.getCaseTitle());
        vo.setEnterpriseName(entity.getEnterpriseName());
        vo.setIndustry(entity.getIndustry());
        vo.setTrainingTopic(entity.getTrainingTopic());
        vo.setCoverImage(entity.getCoverImage());
        vo.setSortOrder(entity.getSortOrder());
        vo.setStatus(entity.getStatus());
        vo.setRejectReason(entity.getRejectReason());
        vo.setTrainingDate(entity.getTrainingDate());
        vo.setReviewedAt(entity.getReviewedAt());
        vo.setCreatedAt(entity.getCreatedAt());
        vo.setUpdatedAt(entity.getUpdatedAt());
        return vo;
    }
}
