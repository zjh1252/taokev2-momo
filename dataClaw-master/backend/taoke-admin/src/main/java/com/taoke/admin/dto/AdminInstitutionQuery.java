package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台机构列表查询参数。
 *
 * @author Fangxinxin
 * @date 2026-04-09 10:00
 */
@Data
public class AdminInstitutionQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 模糊搜索（机构名称、联系电话） */
    private String search;

    /** 按状态过滤：0=待审核，1=已发布，2=已下线 */
    private Integer status;
}
