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
    /** 关键字（逗号分隔） */
    private String keyword;
    private String coverImage;
    private Integer traineeCount;
    /** 培训地点 - 省 ID */
    private Integer provinceId;
    /** 培训地点 - 市 ID */
    private Integer cityId;
    /** 培训地点 - 区/县 ID */
    private Integer districtId;
    /** 培训地点 - 镇/街道 ID */
    private Integer townId;
    /** 培训地点 - 详细地址 */
    private String trainingAddress;
    private Integer sortOrder;
    private Integer status;
    private String rejectReason;
    private LocalDate trainingDate;
    /** 培训结束日期 */
    private LocalDate trainingEndDate;
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
        vo.setKeyword(entity.getKeyword());
        vo.setCoverImage(entity.getCoverImage());
        vo.setTraineeCount(entity.getTraineeCount());
        vo.setProvinceId(entity.getProvinceId());
        vo.setCityId(entity.getCityId());
        vo.setDistrictId(entity.getDistrictId());
        vo.setTownId(entity.getTownId());
        vo.setTrainingAddress(entity.getTrainingAddress());
        vo.setSortOrder(entity.getSortOrder());
        vo.setStatus(entity.getStatus());
        vo.setRejectReason(entity.getRejectReason());
        vo.setTrainingDate(entity.getTrainingDate());
        vo.setTrainingEndDate(entity.getTrainingEndDate());
        vo.setReviewedAt(entity.getReviewedAt());
        vo.setCreatedAt(entity.getCreatedAt());
        vo.setUpdatedAt(entity.getUpdatedAt());
        return vo;
    }
}
