package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台录播课列表查询参数
 *
 * @author Fangxinxin
 * @date 2026-04-08 10:30
 */
@Data
public class AdminVideoQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 模糊搜索（标题、关键词） */
    private String keyword;

    /** 按状态过滤：0=草稿，1=待审核，2=已上架，3=驳回，4=已下架 */
    private Integer status;
}
