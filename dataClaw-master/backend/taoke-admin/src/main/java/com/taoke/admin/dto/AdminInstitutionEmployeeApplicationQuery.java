package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台机构员工申请列表查询参数。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Data
public class AdminInstitutionEmployeeApplicationQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 按申请状态过滤 */
    private Integer status;

    /** 模糊搜索（手机号、昵称） */
    private String search;
}
