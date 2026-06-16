package com.taoke.admin.dto;

import com.taoke.course.entity.interaction.TrainerLeadMessage;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台留言列表 / 详情 VO
 *
 * <p>对齐 {@link TrainerLeadMessage} 持久化字段，附带专家昵称
 * 与状态文案，便于前端直接展示。</p>
 *
 * @author Fangxinxin
 * @date 2026-04-28 19:55
 */
@Data
public class AdminTrainerMessageVO {

    private Integer id;

    /** 目标专家 user_id */
    private Integer trainerUserId;
    /** 目标专家昵称 */
    private String trainerNickname;

    /** 培训主题 */
    private String trainingTopic;
    /** 培训目标 */
    private String trainingGoal;

    private String contactName;
    private String contactMobile;
    private String companyName;
    private String companyPhone;

    /** 培训地点 - 省/市/区 ID */
    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;

    /** 培训天数（自由文本） */
    private String trainingDays;

    private String email;
    private String remark;

    /** 提交人用户 ID（游客时为 null） */
    private Integer userId;
    /** 提交人昵称（如有） */
    private String userNickname;

    /** 状态：0=新建 1=已分配 2=已处理 */
    private Integer status;
    /** 状态文案 */
    private String statusLabel;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AdminTrainerMessageVO from(TrainerLeadMessage entity) {
        AdminTrainerMessageVO vo = new AdminTrainerMessageVO();
        vo.setId(entity.getId());
        vo.setTrainerUserId(entity.getTrainerUserId());
        vo.setTrainingTopic(entity.getTrainingTopic());
        vo.setTrainingGoal(entity.getTrainingGoal());
        vo.setContactName(entity.getContactName());
        vo.setContactMobile(entity.getContactMobile());
        vo.setCompanyName(entity.getCompanyName());
        vo.setCompanyPhone(entity.getCompanyPhone());
        vo.setProvinceId(entity.getProvinceId());
        vo.setCityId(entity.getCityId());
        vo.setDistrictId(entity.getDistrictId());
        vo.setTrainingDays(entity.getTrainingDays());
        vo.setEmail(entity.getEmail());
        vo.setRemark(entity.getRemark());
        vo.setUserId(entity.getUserId());
        vo.setStatus(entity.getStatus());
        vo.setStatusLabel(statusLabel(entity.getStatus()));
        vo.setCreatedAt(entity.getCreatedAt());
        vo.setUpdatedAt(entity.getUpdatedAt());
        return vo;
    }

    public static String statusLabel(Integer status) {
        if (status == null) {
            return "未知";
        }
        return switch (status) {
            case 0 -> "新建";
            case 1 -> "已分配";
            case 2 -> "已处理";
            default -> "未知";
        };
    }
}
