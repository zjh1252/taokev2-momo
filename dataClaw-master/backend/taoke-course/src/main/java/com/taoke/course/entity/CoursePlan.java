package com.taoke.course.entity;

import com.taoke.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * 公开课开课计划实体 — 对应 course_plans 表，线上/线下公开课共用
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Getter
@Setter
@Entity
@Table(name = "course_plans")
public class CoursePlan extends BaseEntity {

    /** 关联课程 ID */
    @Column(name = "course_id", nullable = false)
    private Integer courseId;

    /** 开课开始时间 */
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    /** 开课结束时间 */
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    /** 省份 ID（线下公开课必填，线上为 0） */
    @Column(name = "province_id", nullable = false)
    private Integer provinceId = 0;

    /** 城市 ID（线下公开课必填，线上为 0） */
    @Column(name = "city_id", nullable = false)
    private Integer cityId = 0;

    /** 区/县 ID（选填） */
    @Column(name = "district_id", nullable = false)
    private Integer districtId = 0;

    /** 具体地址（线下公开课必填） */
    @Column(name = "address", nullable = false, length = 300)
    private String address = "";

    /** 开课网址（线上公开课必填） */
    @Column(name = "online_url", nullable = false, length = 500)
    private String onlineUrl = "";

    /** 排序 */
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
