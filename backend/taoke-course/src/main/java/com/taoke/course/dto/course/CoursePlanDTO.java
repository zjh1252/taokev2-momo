package com.taoke.course.dto.course;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 公开课开课计划子对象（创建/编辑/详情共用）
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Data
public class CoursePlanDTO {

    private Integer id;

    /** 提交审核时在服务层校验 */
    private LocalDateTime startTime;

    /** 提交审核时在服务层校验 */
    private LocalDateTime endTime;

    /** 省份 ID（线下公开课必填） */
    private Integer provinceId;

    /** 城市 ID（线下公开课必填） */
    private Integer cityId;

    /** 区/县 ID（选填） */
    private Integer districtId;

    /** 具体地址（线下公开课必填） */
    private String address;

    /** 开课网址（线上公开课必填） */
    private String onlineUrl;

    /** 省份名称（详情展示用，由服务层填充） */
    private String provinceName;

    /** 城市名称（详情展示用，由服务层填充） */
    private String cityName;

    private Integer sortOrder;
}
