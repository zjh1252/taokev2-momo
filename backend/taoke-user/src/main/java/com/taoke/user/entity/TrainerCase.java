package com.taoke.user.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 专家授课案例实体
 *
 * @author Fangxinxin
 * @date 2026-04-11 15:30
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "user_trainer_cases")
public class TrainerCase extends BaseEntity {

    @Column(name = "trainer_id", nullable = false)
    private Integer trainerId;

    /** 案例标题 */
    @Column(name = "case_title", nullable = false, length = 200)
    private String caseTitle;

    /** 客户/企业名称 */
    @Column(name = "enterprise_name", nullable = false, length = 200)
    private String enterpriseName;

    /** 所属行业 */
    @Column(name = "industry", length = 100)
    private String industry;

    /** 培训主题 */
    @Column(name = "training_topic", length = 200)
    private String trainingTopic;

    /** 培训效果描述 */
    @Column(name = "training_effect", columnDefinition = "text")
    private String trainingEffect;

    /** 培训人数 */
    @Column(name = "trainee_count")
    private Integer traineeCount;

    /** 培训地点 - 省 ID */
    @Column(name = "province_id")
    private Integer provinceId;

    /** 培训地点 - 市 ID */
    @Column(name = "city_id")
    private Integer cityId;

    /** 培训地点 - 区/县 ID */
    @Column(name = "district_id")
    private Integer districtId;

    /** 培训地点 - 镇/街道 ID（选填） */
    @Column(name = "town_id")
    private Integer townId;

    /** 培训地点 - 详细地址 */
    @Column(name = "training_address", length = 255)
    private String trainingAddress;

    /** 培训日期 */
    @Column(name = "training_date")
    private LocalDate trainingDate;

    /** 案例详细描述 */
    @Column(name = "description", columnDefinition = "text")
    private String description;

    /** 封面图 URL */
    @Column(name = "cover_image", length = 500)
    private String coverImage;

    /** 案例详情页访问次数 */
    @Column(name = "view_count")
    private Integer viewCount;

    /** 是否系统自动萃取 */
    @Column(name = "auto_extracted", nullable = false, columnDefinition = "tinyint(1)")
    private Boolean autoExtracted;

    /** 排序值，值越大越靠前 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    /** 审核状态：0=待审核, 1=通过, 2=驳回 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint(2)")
    private Integer status;

    /** 驳回原因 */
    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    /** 审核人 ID */
    @Column(name = "reviewer_id")
    private Integer reviewerId;

    /** 审核时间 */
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
