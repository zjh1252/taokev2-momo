package com.taoke.course.dto.demand;

import com.taoke.course.entity.demand.Demand;
import com.taoke.course.enums.DemandCourseKind;
import com.taoke.course.enums.DemandFormat;
import com.taoke.course.enums.DemandStatus;
import com.taoke.course.enums.DemandType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 需求详情响应
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class DemandDetailResponse {

    private Integer id;
    private String demandNo;
    private Integer userId;
    private Integer enterpriseId;
    private String demandType;
    private String demandTypeLabel;
    private String title;
    private String trainingTopic;
    private Integer traineeCount;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private LocalDate expectedStartDate;
    private String format;
    private String formatLabel;
    private String description;
    private Integer sourceCaseId;
    private Integer sourceCourseId;
    private String contactName;
    private String contactPhone;
    private String companyName;
    private String contactEmail;
    private String companyTel;
    private Integer expertiseCategoryId;
    private Integer expectedProposalCount;
    private Integer sourceTrainerId;
    private String courseKind;
    private String courseKindLabel;
    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private Integer status;
    private String statusLabel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** 跟进记录列表 */
    private List<DemandFollowUpResponse> followUps;

    public static DemandDetailResponse from(Demand d) {
        DemandDetailResponse r = new DemandDetailResponse();
        r.setId(d.getId());
        r.setDemandNo(d.getDemandNo());
        r.setUserId(d.getUserId());
        r.setEnterpriseId(d.getEnterpriseId());
        r.setDemandType(d.getDemandType());
        try {
            r.setDemandTypeLabel(DemandType.valueOf(d.getDemandType()).getLabel());
        } catch (Exception ignored) {
            r.setDemandTypeLabel(d.getDemandType());
        }
        r.setTitle(d.getTitle());
        r.setTrainingTopic(d.getTrainingTopic());
        r.setTraineeCount(d.getTraineeCount());
        r.setBudgetMin(d.getBudgetMin());
        r.setBudgetMax(d.getBudgetMax());
        r.setExpectedStartDate(d.getExpectedStartDate());
        r.setFormat(d.getFormat());
        if (d.getFormat() != null) {
            try {
                r.setFormatLabel(DemandFormat.valueOf(d.getFormat()).getLabel());
            } catch (Exception ignored) {
                r.setFormatLabel(d.getFormat());
            }
        }
        r.setDescription(d.getDescription());
        r.setSourceCaseId(d.getSourceCaseId());
        r.setSourceCourseId(d.getSourceCourseId());
        r.setContactName(d.getContactName());
        r.setContactPhone(d.getContactPhone());
        r.setCompanyName(d.getCompanyName());
        r.setContactEmail(d.getContactEmail());
        r.setCompanyTel(d.getCompanyTel());
        r.setExpertiseCategoryId(d.getExpertiseCategoryId());
        r.setExpectedProposalCount(d.getExpectedProposalCount());
        r.setSourceTrainerId(d.getSourceTrainerId());
        r.setCourseKind(d.getCourseKind());
        if (d.getCourseKind() != null) {
            try {
                r.setCourseKindLabel(DemandCourseKind.valueOf(d.getCourseKind()).getLabel());
            } catch (Exception ignored) {
                r.setCourseKindLabel(d.getCourseKind());
            }
        }
        r.setProvinceId(d.getProvinceId());
        r.setCityId(d.getCityId());
        r.setDistrictId(d.getDistrictId());
        r.setStatus(d.getStatus());
        r.setStatusLabel(DemandStatus.of(d.getStatus()).getLabel());
        r.setCreatedAt(d.getCreatedAt());
        r.setUpdatedAt(d.getUpdatedAt());
        return r;
    }
}
