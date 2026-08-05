package com.taoke.user.dto.alliance;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 培训合伙人申请响应。
 *
 * @author Fangxinxin
 * @date 2026-07-13 18:00
 */
@Data
public class AlliancePartnerApplicationResponse {

    private Integer id;
    private Integer userId;
    private String partnerCode;
    private String contactName;
    private String companyName;
    private String companyPhone;
    private String companyEmail;
    private Integer provinceId;
    private Integer cityId;
    private String legalPerson;
    private String legalIdCard;
    private String contactQq;
    private String agreementVersion;
    private Integer status;
    private String rejectReason;
    private LocalDateTime reviewedAt;
    private Integer reviewedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
