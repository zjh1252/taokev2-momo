package com.taoke.course.entity.interaction;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * 专家留言实体 — 对应 trainer_lead_messages 表
 * <p>
 * 对齐旧站「给XX留言」弹窗，字段包括培训主题、培训目标、联系信息等。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-08 14:00
 */
@Getter
@Setter
@Entity
@Table(name = "trainer_lead_messages")
public class TrainerLeadMessage extends BaseEntity {

    /** 目标专家 user_id */
    @Column(name = "trainer_user_id", nullable = false)
    private Integer trainerUserId;

    /** 培训主题 2~30 字 */
    @Column(name = "training_topic", nullable = false, length = 100)
    private String trainingTopic;

    /** 培训目标详述 */
    @Column(name = "training_goal", columnDefinition = "text")
    private String trainingGoal;

    /** 联系人姓名 */
    @Column(name = "contact_name", nullable = false, length = 50)
    private String contactName;

    /** 联系手机 */
    @Column(name = "contact_mobile", nullable = false, length = 20)
    private String contactMobile;

    /** 公司名称 */
    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    /** 公司电话 */
    @Column(name = "company_phone", length = 20)
    private String companyPhone;

    /** 省 ID */
    @Column(name = "province_id")
    private Integer provinceId;

    /** 市 ID */
    @Column(name = "city_id")
    private Integer cityId;

    /** 培训天数 */
    @Column(name = "training_days", length = 20)
    private String trainingDays;

    /** Email */
    @Column(name = "email", length = 100)
    private String email;

    /** 备注 */
    @Column(name = "remark", columnDefinition = "text")
    private String remark;

    /** 提交人用户 ID */
    @Column(name = "user_id")
    private Integer userId;

    /** 状态：0=新建 1=已分配 2=已处理 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint(2)")
    private Integer status = 0;
}
