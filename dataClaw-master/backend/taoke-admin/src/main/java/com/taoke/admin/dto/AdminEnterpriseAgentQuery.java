package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台经纪公司列表查询参数。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Data
public class AdminEnterpriseAgentQuery {

    private int page = 1;
    private int size = 10;
    private String search;
}
