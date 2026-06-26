package com.taoke.admin.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 后台用户详情视图（含资源统计与认证摘要）。
 *
 * @author Fangxinxin
 * @date 2026-06-12 14:00
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AdminUserDetailVO extends AdminUserVO {

    /** 邮箱 */
    private String email;

    /** 用户名 */
    private String username;

    /** 省份 ID */
    private Integer provinceId;

    /** 城市 ID */
    private Integer cityId;

    /** 详细地址 */
    private String address;

    /** 专家档案 ID（若有 TRAINER 角色） */
    private Integer trainerId;

    /** 专家档案状态 */
    private Integer trainerStatus;

    /** 实名认证状态：NULL=未提交 1=待审核 2=已通过 3=已驳回 */
    private Integer realNameCertStatus;

    /** 视频数量（作为发布者） */
    private Integer videoCount;
}
