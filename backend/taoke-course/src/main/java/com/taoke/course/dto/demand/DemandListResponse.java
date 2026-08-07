package com.taoke.course.dto.demand;

import com.taoke.course.entity.demand.Demand;
import com.taoke.course.enums.DemandStatus;
import com.taoke.course.enums.DemandType;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 需求列表项响应
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class DemandListResponse {

    private Integer id;
    private String demandNo;
    private String demandType;
    private String demandTypeLabel;
    private String title;
    private String trainingTopic;
    private Integer status;
    private String statusLabel;
    private BigDecimal budgetMin;
    private BigDecimal budgetMax;
    private String format;
    /** 培训形式中文标签 */
    private String formatLabel;
    /** 培训类型：PUBLIC=公开课, INTERNAL=内训课 */
    private String courseType;
    private Integer traineeCount;
    private LocalDateTime createdAt;

    /** 提交人用户 ID（管理端使用） */
    private Integer userId;

    /** 省份 ID */
    private Integer provinceId;
    /** 城市 ID */
    private Integer cityId;
    /** 区/县 ID */
    private Integer districtId;
    /** 培训地区展示文案（省市区拼接） */
    private String trainingRegion;

    public static DemandListResponse from(Demand d) {
        DemandListResponse r = new DemandListResponse();
        r.setId(d.getId());
        r.setDemandNo(d.getDemandNo());
        r.setDemandType(d.getDemandType());
        try {
            r.setDemandTypeLabel(DemandType.valueOf(d.getDemandType()).getLabel());
        } catch (Exception ignored) {
            r.setDemandTypeLabel(d.getDemandType());
        }
        r.setTitle(d.getTitle());
        r.setTrainingTopic(d.getTrainingTopic());
        r.setStatus(d.getStatus());
        r.setStatusLabel(DemandStatus.of(d.getStatus()).getLabel());
        r.setBudgetMin(d.getBudgetMin());
        r.setBudgetMax(d.getBudgetMax());
        r.setFormat(d.getFormat());
        if (d.getFormat() != null) {
            try {
                r.setFormatLabel(com.taoke.course.enums.DemandFormat.valueOf(d.getFormat()).getLabel());
            } catch (Exception ignored) {
                r.setFormatLabel(d.getFormat());
            }
        }
        r.setCourseType(d.getCourseType());
        r.setTraineeCount(d.getTraineeCount());
        r.setCreatedAt(d.getCreatedAt());
        r.setUserId(d.getUserId());
        r.setProvinceId(d.getProvinceId());
        r.setCityId(d.getCityId());
        r.setDistrictId(d.getDistrictId());
        return r;
    }
}
