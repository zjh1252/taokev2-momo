package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台企业采购方列表视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-09 17:00
 */
@Data
public class AdminEnterpriseBuyerVO {

    private Integer id;
    private Integer userId;

    /** 公司名称 */
    private String companyName;

    /** 所属行业 */
    private String industry;

    /** 公司规模 */
    private String companySize;

    /** 联系人姓名 */
    private String contactName;

    /** 联系电话 */
    private String contactPhone;

    private LocalDateTime createdAt;
}
