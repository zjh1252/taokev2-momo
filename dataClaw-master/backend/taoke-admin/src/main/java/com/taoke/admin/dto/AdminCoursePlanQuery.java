package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台排课计划查询参数
 *
 * @author Fangxinxin
 * @date 2026-04-03 10:00
 */
@Data
public class AdminCoursePlanQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 模糊搜索（地址） */
    private String keyword;

    /** 按课程 ID 筛选 */
    private Integer courseId;
}
