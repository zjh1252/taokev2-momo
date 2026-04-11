package com.taoke.user.dto.trainercase;

import com.taoke.user.entity.TrainerCase;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 案例响应 DTO
 *
 * @author Fangxinxin
 * @date 2026-04-11 16:00
 */
@Data
public class TrainerCaseResponse {

    private Integer id;
    private Integer trainerId;
    private String caseTitle;
    private String enterpriseName;
    private String industry;
    private String trainingTopic;
    private String trainingEffect;
    private Integer traineeCount;
    private LocalDate trainingDate;
    private String description;
    private String coverImage;
    private Boolean autoExtracted;
    private Integer sortOrder;
    private Integer status;
    private String rejectReason;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 案例关联的文件列表 */
    private List<TrainerCaseFileResponse> files;

    public static TrainerCaseResponse from(TrainerCase entity) {
        TrainerCaseResponse r = new TrainerCaseResponse();
        r.setId(entity.getId());
        r.setTrainerId(entity.getTrainerId());
        r.setCaseTitle(entity.getCaseTitle());
        r.setEnterpriseName(entity.getEnterpriseName());
        r.setIndustry(entity.getIndustry());
        r.setTrainingTopic(entity.getTrainingTopic());
        r.setTrainingEffect(entity.getTrainingEffect());
        r.setTraineeCount(entity.getTraineeCount());
        r.setTrainingDate(entity.getTrainingDate());
        r.setDescription(entity.getDescription());
        r.setCoverImage(entity.getCoverImage());
        r.setAutoExtracted(entity.getAutoExtracted());
        r.setSortOrder(entity.getSortOrder());
        r.setStatus(entity.getStatus());
        r.setRejectReason(entity.getRejectReason());
        r.setReviewedAt(entity.getReviewedAt());
        r.setCreatedAt(entity.getCreatedAt());
        r.setUpdatedAt(entity.getUpdatedAt());
        return r;
    }
}
