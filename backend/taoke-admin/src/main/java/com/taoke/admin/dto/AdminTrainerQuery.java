package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台专家列表查询参数。
 *
 * @author Fangxinxin
 * @date 2026-04-02 10:00
 */
@Data
public class AdminTrainerQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 模糊搜索（姓名、头衔） */
    private String search;

    /** 按专家状态过滤：0=草稿，1=待审核，2=审核通过，3=审核驳回，4=已禁用 */
    private Integer status;
}
