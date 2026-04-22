package com.taoke.user.dto.institution;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 机构信息返回
 *
 * @author Fangxinxin
 * @date 2026-03-31 16:00
 */
@Data
public class InstitutionResponse {

    private Integer id;
    private String orgName;
    private Integer orgType;
    private String licenseNo;
    private String bio;
    private String homepageConfig;
    private String contactName;
    private String contactPhone;
    private Integer showContact;
    private String postCode;
    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private Integer townId;
    private String address;

    /** 服务过的客户描述（部分客户） */
    private String clientCases;

    /** 成功案例（长文本） */
    private String successCases;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
