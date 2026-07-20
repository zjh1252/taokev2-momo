package com.taoke.course.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.DynamicUpdate;

import java.time.LocalDateTime;

/**
 * 线上公开课预约记录 — 对应 course_reserves 表
 *
 * @author Fangxinxin
 * @date 2026-07-16 15:15
 */
@Getter
@Setter
@Entity
@DynamicInsert
@DynamicUpdate
@Table(name = "course_reserves")
public class CourseReserve extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "course_id", nullable = false)
    private Integer courseId;

    @Column(name = "order_id", nullable = false)
    private Integer orderId = 0;

    /** 1=预约成功 0=已取消 */
    @Column(name = "reserve_status", nullable = false, columnDefinition = "tinyint")
    private Integer reserveStatus = 1;

    @Column(name = "reserved_at", nullable = false)
    private LocalDateTime reservedAt;
}
