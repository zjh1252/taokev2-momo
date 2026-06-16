package com.taoke.admin.dto.rolecert;

import lombok.Data;

/**
 * 后台 — 三角色资质认证审核列表查询参数（经纪人工作认证 / 经纪公司资质 / 机构公司资料 共用）。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Data
public class AdminRoleCertQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 状态过滤：1=待审核 2=已通过 3=已驳回；不传=全部已提交记录 */
    private Integer status;

    /** 模糊搜索（手机号 / 昵称 / 真实姓名 / 公司名等） */
    private String search;
}
