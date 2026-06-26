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
    /** 专家所属 user_id，用于代管角色编辑场景下的归属展示 */
    private Integer trainerUserId;
    /** 专家昵称，用于编辑场景下的归属展示 */
    private String trainerName;
    private String caseTitle;
    private String enterpriseName;
    private String industry;
    private String trainingTopic;
    /** 关键字（逗号分隔） */
    private String keyword;
    private String trainingEffect;
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
    /** 培训地点 - 省名称（公开详情接口填充） */
    private String provinceName;
    /** 培训地点 - 市名称（公开详情接口填充） */
    private String cityName;
    /** 培训地点 - 区/县名称（公开详情接口填充） */
    private String districtName;
    private LocalDate trainingDate;
    /** 培训结束日期 */
    private LocalDate trainingEndDate;
    private String description;
    private String coverImage;
    /** 案例详情页访问次数 */
    private Integer viewCount;
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
        r.setKeyword(entity.getKeyword());
        r.setTrainingEffect(entity.getTrainingEffect());
        r.setTraineeCount(entity.getTraineeCount());
        r.setProvinceId(entity.getProvinceId());
        r.setCityId(entity.getCityId());
        r.setDistrictId(entity.getDistrictId());
        r.setTownId(entity.getTownId());
        r.setTrainingAddress(entity.getTrainingAddress());
        r.setTrainingDate(entity.getTrainingDate());
        r.setTrainingEndDate(entity.getTrainingEndDate());
        r.setDescription(entity.getDescription());
        r.setCoverImage(entity.getCoverImage());
        r.setViewCount(entity.getViewCount() != null ? entity.getViewCount() : 0);
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
