package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台用户列表查询参数。
 *
 * @author Fangxinxin
 * @date 2026-03-20
 */
@Data
public class AdminUserQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 模糊搜索（手机号、昵称、真实姓名） */
    private String search;

    /** 按用户状态过滤（0=冻结, 1=正常） */
    private Integer status;
}
