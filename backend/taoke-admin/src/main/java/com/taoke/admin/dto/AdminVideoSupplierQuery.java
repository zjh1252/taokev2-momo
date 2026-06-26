package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台录播课供应商列表查询参数
 *
 * @author Fangxinxin
 * @date 2026-06-12 10:00
 */
@Data
public class AdminVideoSupplierQuery {

    private int page = 1;

    private int size = 10;

    private String keyword;

    private Boolean enabled;
}
