package com.taoke.admin.dto.rolecert;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 后台 — 培训机构「公司资料」审核列表项。
 *
 * @author Fangxinxin
 * @date 2026-04-16 18:00
 */
@Data
public class AdminInstitutionCompanyInfoVO {

    /** user_institutions.id */
    private Integer institutionId;

    private Integer userId;
    private String phone;
    private String nickname;
    private String orgName;

    private String logoUrl;
    private String companyNature;
    private String website;
    private String companySize;
    private String annualRevenue;
    private String registeredCapital;

    private Integer provinceId;
    private Integer cityId;
    private Integer districtId;
    private Integer townId;
    private String address;
    private String postCode;

    private BigDecimal maxCommissionRate;
    private List<String> paymentMethods;
    private Integer hasCopyrightCourse;

    private String bankCardNo;
    private String bankName;
    private String bankBranch;

    private String licenseDocUrl;
    private String licenseNo;

    /** 1=待审核 2=已通过 3=已驳回 */
    private Integer status;
    private String rejectReason;
    private LocalDateTime submittedAt;
    private LocalDateTime auditedAt;
}
