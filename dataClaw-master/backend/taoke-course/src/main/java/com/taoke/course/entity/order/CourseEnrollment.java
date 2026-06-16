package com.taoke.course.entity.order;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 公开课报名记录实体 — 对应 course_enrollments 表
 * <p>
 * 结构与 {@link com.taoke.course.entity.video.VideoEnrollment} 对齐，
 * 支付完成后由系统自动创建。
 * </p>
 *
 * @author Fangxinxin
 * @date 2026-04-07 16:00
 */
@Getter
@Setter
@Entity
@Table(name = "course_enrollments")
public class CourseEnrollment extends BaseEntity {

    /** 公开课ID */
    @Column(name = "course_id", nullable = false)
    private Integer courseId;

    /** 报名用户ID */
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    /** 关联订单ID */
    @Column(name = "order_id", nullable = false)
    private Integer orderId = 0;

    /** 实付金额 */
    @Column(name = "price_paid", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePaid = BigDecimal.ZERO;

    /** 报名时间 */
    @Column(name = "enrolled_at")
    private LocalDateTime enrolledAt;

    /** 过期时间 */
    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    /** 状态：1=有效 0=已取消/退款 */
    @Column(name = "status", nullable = false, columnDefinition = "tinyint")
    private Integer status = 1;
}
