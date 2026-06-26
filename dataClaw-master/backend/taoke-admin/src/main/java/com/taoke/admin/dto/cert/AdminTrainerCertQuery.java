package com.taoke.admin.dto.cert;

import lombok.Data;

/**
 * 后台专家资质认证审核列表查询参数（实名 / 专业 / 学历 / 工作 共用）。
 *
 * @author Fangxinxin
 * @date 2026-04-16 10:00
 */
@Data
public class AdminTrainerCertQuery {

    /** 页码，从 1 开始 */
    private int page = 1;

    /** 每页条数 */
    private int size = 10;

    /** 状态过滤：1=待审核 2=已通过 3=已驳回；不传=全部 */
    private Integer status;

    /** 模糊搜索（手机号 / 昵称 / 真实姓名 / 院校 / 单位） */
    private String search;
}
