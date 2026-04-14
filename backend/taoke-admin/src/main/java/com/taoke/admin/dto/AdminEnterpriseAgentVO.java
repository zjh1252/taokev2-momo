package com.taoke.admin.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 后台经纪公司列表视图对象。
 *
 * @author Fangxinxin
 * @date 2026-04-14 15:00
 */
@Data
public class AdminEnterpriseAgentVO {

    private Integer id;
    private Integer userId;
    private String companyName;
    private String licenseNo;
    private String contactName;
    private String contactPhone;
    private String industry;
    private String companySize;
    private LocalDateTime createdAt;
}
