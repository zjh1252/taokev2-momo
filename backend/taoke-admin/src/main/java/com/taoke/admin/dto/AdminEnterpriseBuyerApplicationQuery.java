package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台企业采购方申请列表查询参数。
 *
 * @author Fangxinxin
 * @date 2026-04-09 17:00
 */
@Data
public class AdminEnterpriseBuyerApplicationQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 按申请状态过滤：2=待审核，3=已驳回 等 */
    private Integer status;

    /** 模糊搜索（手机号、公司名称） */
    private String search;
}
