package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台课程列表查询参数
 *
 * @author Fangxinxin
 * @date 2026-04-02 15:00
 */
@Data
public class AdminCourseQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 模糊搜索（标题、关键词） */
    private String keyword;

    /** 按课程状态过滤：0=草稿，1=待审核，2=已上架，3=驳回，4=已下架 */
    private Integer status;

    /** 按课程类型过滤：INTERNAL / OPEN_OFFLINE / OPEN_ONLINE */
    private String type;

    /** 按关联专家 ID 过滤（courses.trainer_id） */
    private Integer trainerId;

    /** 按发布者类型过滤：TRAINER / INSTITUTION / ENTERPRISE_AGENT */
    private String publisherType;

    /** 按发布方名称模糊搜索（专家姓名/机构名称），解析为 publisher userId 集合 */
    private String publisherName;

    /** 按发布者用户 ID 过滤（courses.publisher_id） */
    private Integer publisherId;
}
