package com.taoke.admin.dto;

import lombok.Data;

/**
 * 后台专家详情 — 维护人（助理/经纪人/经纪公司/机构）绑定摘要。
 *
 * @author Fangxinxin
 * @date 2026-06-25 20:00
 */
@Data
public class AdminTrainerMaintainerVO {

    /** assistant / agent / enterprise_agent / institution */
    private String roleType;

    /** 角色中文名 */
    private String roleLabel;

    /** 联系人姓名 */
    private String contactName;

    /** 联系电话 */
    private String contactPhone;

    /** 机构/公司名称（经纪/经纪公司/机构适用） */
    private String orgName;
}
