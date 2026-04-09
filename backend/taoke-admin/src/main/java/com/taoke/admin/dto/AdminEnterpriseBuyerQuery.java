package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台企业采购方列表查询参数。
 *
 * @author Fangxinxin
 * @date 2026-04-09 17:00
 */
@Data
public class AdminEnterpriseBuyerQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 模糊搜索（公司名称、联系电话） */
    private String search;
}
