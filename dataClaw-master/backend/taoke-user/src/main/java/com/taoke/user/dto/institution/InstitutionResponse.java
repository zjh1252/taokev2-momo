package com.taoke.user.dto.institution;

import lombok.Data;

import java.time.LocalDate;
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
    private String legalRepresentative;
    private String licenseNo;
    private LocalDate establishedAt;
    private String logoUrl;
    private String bio;
    /** 擅长行业 — 分类 ID 逗号串（前端解析为 number[]） */
    private String industries;
    /** 擅长领域 — 分类 ID 逗号串（前端解析为 number[]） */
    private String specialties;
    private Integer hasVenue;
    private Integer hasExperts;
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

    /** 注册培训机构合作协议签署时间 */
    private LocalDateTime agreementSignedAt;

    /** 协议版本号 */
    private String agreementVersion;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
