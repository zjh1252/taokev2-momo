package com.taoke.user.dto.enterpriseagent;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 专家经纪公司信息返回
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Data
public class EnterpriseAgentResponse {

    private Integer id;
    private String companyName;
    private String licenseNo;
    private String legalPerson;
    private String industry;
    private String companySize;
    private String contactName;
    private String contactPhone;
    private String postCode;
    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private Integer townId;
    private String address;
    private String qualificationDocUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
