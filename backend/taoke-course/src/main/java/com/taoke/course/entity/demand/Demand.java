package com.taoke.course.entity.demand;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 培训需求实体 — 对应 demands 表
 * <p>
 * 统一存储所有类型的培训需求，通过 demand_type 区分来源。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Getter
@Setter
@Entity
@Table(name = "demands")
@DynamicInsert
@DynamicUpdate
public class Demand extends BaseEntity {

    /** 提交人用户 ID（游客提交时为空） */
    @Column(name = "user_id")
    private Integer userId;

    /** 需求单号（对外展示） */
    @Column(name = "demand_no", nullable = false, length = 32)
    private String demandNo;

    /** 企业信息 ID，关联 user_enterprise_buyers.id */
    @Column(name = "enterprise_id")
    private Integer enterpriseId;

    /** 需求类型 */
    @Column(name = "demand_type", nullable = false, length = 30)
    private String demandType;

    /** 需求标题 */
    @Column(name = "title", length = 200)
    private String title;

    /** 培训主题 */
    @Column(name = "training_topic", length = 200)
    private String trainingTopic;

    /** 培训人数 */
    @Column(name = "trainee_count")
    private Integer traineeCount;

    /** 预算最低金额 */
    @Column(name = "budget_min", precision = 12, scale = 2)
    private BigDecimal budgetMin;

    /** 预算最高金额 */
    @Column(name = "budget_max", precision = 12, scale = 2)
    private BigDecimal budgetMax;

    /** 期望开始日期 */
    @Column(name = "expected_start_date")
    private LocalDate expectedStartDate;

    /** 培训形式 */
    @Column(name = "format", length = 20)
    private String format;

    /** 需求详细描述 */
    @Column(name = "description", columnDefinition = "text")
    private String description;

    /** 来源案例 ID（案例定制时关联） */
    @Column(name = "source_case_id")
    private Integer sourceCaseId;

    /** 来源课程 ID（内训课预约时关联） */
    @Column(name = "source_course_id")
    private Integer sourceCourseId;

    /** 联系人 */
    @Column(name = "contact_name", length = 50)
    private String contactName;

    /** 联系电话 */
    @Column(name = "contact_phone", length = 30)
    private String contactPhone;

    /** 公司名称 */
    @Column(name = "company_name", length = 200)
    private String companyName;

    /** 联系邮箱 */
    @Column(name = "contact_email", length = 100)
    private String contactEmail;

    /** 公司电话 */
    @Column(name = "company_tel", length = 30)
    private String companyTel;

    /** 擅长领域一级分类 ID（公开课） */
    @Column(name = "expertise_category_id")
    private Integer expertiseCategoryId;

    /** 期望方案数（内训课） */
    @Column(name = "expected_proposal_count")
    private Integer expectedProposalCount;

    /** 指定讲师 ID */
    @Column(name = "source_trainer_id")
    private Integer sourceTrainerId;

    /** 课程种类：OPEN / INTERNAL */
    @Column(name = "course_kind", length = 20)
    private String courseKind;

    /** 省份 ID */
    @Column(name = "province_id")
    private Integer provinceId;

    /** 城市 ID */
    @Column(name = "city_id")
    private Integer cityId;

    /** 区/县 ID */
    @Column(name = "district_id")
    private Integer districtId;

    /** 状态：1=已提交, 2=处理中, 3=已匹配, 4=已完成, 5=已取消 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint(2)")
    private Integer status;
}
