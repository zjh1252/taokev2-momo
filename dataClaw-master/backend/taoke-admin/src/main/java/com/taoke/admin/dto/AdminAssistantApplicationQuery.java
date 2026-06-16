package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台助理申请列表查询参数。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Data
public class AdminAssistantApplicationQuery {

    private int page = 1;
    private int size = 10;
    private Integer status;
    private String search;
}
